<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\EnglishAssessment;
use App\Models\EnglishClass;
use App\Models\EoiSubmission;
use App\Models\Lead;
use App\Models\Program;
use App\Models\Property;
use App\Models\School;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Global, role-gated, multi-entity search. Uses MySQL LIKE (bound
 * values) — no external search engine. Each entity has its own searcher
 * method so the query, role gate, and result shaping stay next to the
 * data; add a new entity by registering a method here.
 *
 * Relevance is a simple deterministic score: exact field match (100) >
 * starts-with (50) > contains (10), best field wins, ties broken by
 * recency. Results are grouped by entity type, capped per group and
 * overall.
 */
class SearchService
{
    public const MIN_QUERY = 2;
    private const PER_GROUP = 5;
    private const MAX_TOTAL = 25;
    private const CANDIDATES = 25; // rows pulled per entity for scoring

    /**
     * Entity → [searcher method, roles allowed]. admin/super_admin are
     * implicitly allowed for every entity (added in canSee()).
     */
    private const ENTITIES = [
        Lead::class              => ['searchLeads', ['sales', 'education', 'english', 'immigration', 'immigration_manager', 'immigration_adviser', 'accommodation']],
        Tenant::class            => ['searchTenants', ['accommodation']],
        Property::class          => ['searchProperties', ['accommodation']],
        Program::class           => ['searchPrograms', ['education']],
        School::class            => ['searchSchools', ['education']],
        EnglishClass::class      => ['searchEnglishClasses', ['english']],
        EnglishAssessment::class => ['searchEnglishAssessments', ['english']],
        EoiSubmission::class     => ['searchEoiSubmissions', ['accommodation']],
        Booking::class           => ['searchBookings', ['sales']],
    ];

    /** Per-entity display metadata (label + lucide icon name). */
    private const META = [
        Lead::class              => ['type' => 'Lead', 'label' => 'Leads', 'icon' => 'Users'],
        Tenant::class            => ['type' => 'Tenant', 'label' => 'Tenants', 'icon' => 'Home'],
        Property::class          => ['type' => 'Property', 'label' => 'Properties', 'icon' => 'Building2'],
        Program::class           => ['type' => 'Program', 'label' => 'Programs', 'icon' => 'GraduationCap'],
        School::class            => ['type' => 'School', 'label' => 'Schools', 'icon' => 'School'],
        EnglishClass::class      => ['type' => 'EnglishClass', 'label' => 'English Classes', 'icon' => 'Languages'],
        EnglishAssessment::class => ['type' => 'EnglishAssessment', 'label' => 'English Assessments', 'icon' => 'ClipboardCheck'],
        EoiSubmission::class     => ['type' => 'EoiSubmission', 'label' => 'Applications', 'icon' => 'FileText'],
        Booking::class           => ['type' => 'Booking', 'label' => 'Bookings', 'icon' => 'CalendarClock'],
    ];

    /**
     * Run a search for $user. Returns a list of groups:
     *   [ ['type','label','icon','items'=>[...],'total'=>int,'see_all_url'=>?string], ... ]
     * Each item: ['id','label','sublabel','url','score','badge'?].
     */
    public function search(string $query, User $user): array
    {
        $query = trim($query);
        if (mb_strlen($query) < self::MIN_QUERY) {
            return [];
        }

        $groups = [];
        $running = 0;

        foreach (self::ENTITIES as $class => [$method, $roles]) {
            if (! $this->canSee($roles, $user)) {
                continue;
            }
            if ($running >= self::MAX_TOTAL) {
                break;
            }

            [$items, $total] = $this->{$method}($query, $user);
            if ($total === 0) {
                continue;
            }

            // Respect the overall cap across groups.
            $room = self::MAX_TOTAL - $running;
            $items = array_slice($items, 0, min(self::PER_GROUP, $room));
            $running += count($items);

            $meta = self::META[$class];
            $groups[] = [
                'type'        => $meta['type'],
                'label'       => $meta['label'],
                'icon'        => $meta['icon'],
                'items'       => $items,
                'total'       => $total,
                'see_all_url' => $total > count($items) ? $this->seeAllUrl($class, $query, $user) : null,
            ];
        }

        return $groups;
    }

    // ─── Role gate ────────────────────────────────────────────────────────

    private function canSee(array $roles, User $user): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        return in_array($user->role, $roles, true);
    }

    // ─── Scoring ──────────────────────────────────────────────────────────

    /** Score one value against the query: 100 exact, 50 prefix, 10 contains. */
    private function scoreValue(?string $value, string $q): int
    {
        if ($value === null || $value === '') {
            return 0;
        }
        $v = mb_strtolower($value);
        $q = mb_strtolower($q);
        if ($v === $q) {
            return 100;
        }
        if (str_starts_with($v, $q)) {
            return 50;
        }
        if (str_contains($v, $q)) {
            return 10;
        }

        return 0;
    }

    /** Best score across several candidate values. */
    private function scoreFields(array $values, string $q): int
    {
        return collect($values)->map(fn ($v) => $this->scoreValue($v, $q))->max() ?: 0;
    }

    /**
     * Apply an OR-LIKE across columns (bound values). $namePairs adds a
     * concatenated "first last" match so a full-name query like
     * "Mariana Cruz" still hits rows where the two names live in separate
     * columns. Column names are fixed constants (never user input).
     */
    private function applyLike(Builder $query, array $columns, string $q, array $namePairs = []): Builder
    {
        return $query->where(function (Builder $sub) use ($columns, $q, $namePairs) {
            foreach ($columns as $col) {
                $sub->orWhere($col, 'like', "%{$q}%");
            }
            foreach ($namePairs as [$a, $b]) {
                $sub->orWhereRaw('LOWER(' . $this->concatExpr($a, $b) . ') LIKE ?', ['%' . mb_strtolower($q) . '%']);
            }
        });
    }

    /** Driver-portable "first last" concatenation expression. */
    private function concatExpr(string $a, string $b): string
    {
        return \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite'
            ? "({$a} || ' ' || {$b})"
            : "CONCAT({$a}, ' ', {$b})";
    }

    /**
     * Shared pipeline: count total, pull candidates, score+sort, take top N.
     *
     * @param  callable  $shape  fn($model): array  → item without score
     * @param  callable  $scoreOf  fn($model): int  → relevance score
     * @return array{0: array<int,array>, 1: int}  [items, total]
     */
    private function collect(Builder $countable, Builder $candidates, callable $shape, callable $scoreOf): array
    {
        $total = (clone $countable)->count();

        $items = $candidates
            ->limit(self::CANDIDATES)
            ->get()
            ->map(fn ($m) => $shape($m) + ['score' => $scoreOf($m), 'updated_at' => $m->updated_at])
            ->sortByDesc(fn ($i) => [$i['score'], optional($i['updated_at'])->timestamp ?? 0])
            ->values()
            ->take(self::PER_GROUP)
            ->map(function ($i) {
                unset($i['updated_at']);

                return $i;
            })
            ->all();

        return [$items, $total];
    }

    // ─── Entity searchers ─────────────────────────────────────────────────

    private function searchLeads(string $q, User $user): array
    {
        $cols = ['first_name', 'last_name', 'email', 'phone', 'lead_id', 'tracking_code'];
        $pairs = [['first_name', 'last_name']];
        $count = $this->applyLike(Lead::query(), $cols, $q, $pairs);
        $cand = $this->applyLike(Lead::query(), $cols, $q, $pairs)->orderByDesc('updated_at');

        return $this->collect($count, $cand, function (Lead $l) use ($user) {
            $name = trim("{$l->first_name} {$l->last_name}") ?: 'Unknown';
            $sub = collect([$l->email, $l->stage, $l->lead_id])->filter()->implode(' · ');

            return [
                'id'       => $l->id,
                'label'    => $name,
                'sublabel' => $sub,
                'url'      => $this->resolveUrl(Lead::class, $l, $user),
            ];
        }, function (Lead $l) use ($q) {
            $name = trim("{$l->first_name} {$l->last_name}");

            return $this->scoreFields([$name, $l->first_name, $l->last_name, $l->email, $l->phone, $l->lead_id, $l->tracking_code], $q);
        });
    }

    private function searchTenants(string $q, User $user): array
    {
        $cols = ['first_name', 'family_name', 'display_name_override', 'email', 'phone'];
        $pairs = [['first_name', 'family_name']];
        $count = $this->applyLike(Tenant::query(), $cols, $q, $pairs);
        $cand = $this->applyLike(Tenant::with('property'), $cols, $q, $pairs)->orderByDesc('updated_at');

        return $this->collect($count, $cand, function (Tenant $t) use ($user) {
            $name = $t->display_name_override ?: trim("{$t->first_name} {$t->family_name}") ?: 'Tenant';

            return [
                'id'       => $t->id,
                'label'    => $name,
                'sublabel' => collect([$t->email, optional($t->property)->name])->filter()->implode(' · '),
                'url'      => $this->resolveUrl(Tenant::class, $t, $user),
                'badge'    => $t->current_status,
            ];
        }, fn (Tenant $t) => $this->scoreFields([$t->display_name_override, $t->first_name, $t->family_name, trim("{$t->first_name} {$t->family_name}"), $t->email, $t->phone], $q));
    }

    private function searchProperties(string $q, User $user): array
    {
        $cols = ['name', 'code', 'address', 'city', 'suburb', 'property_manager_name'];
        $count = $this->applyLike(Property::query(), $cols, $q);
        $cand = $this->applyLike(Property::query(), $cols, $q)->orderByDesc('updated_at');

        return $this->collect($count, $cand, function (Property $p) use ($user) {
            $label = $p->code ? "{$p->code} — {$p->name}" : $p->name;
            $rent = $p->rent_single ? '$' . (int) $p->rent_single . '/wk' : null;

            return [
                'id'       => $p->id,
                'label'    => $label,
                'sublabel' => collect([$p->suburb ?: $p->city, $rent])->filter()->implode(' · '),
                'url'      => $this->resolveUrl(Property::class, $p, $user),
                'badge'    => $p->status,
            ];
        }, fn (Property $p) => $this->scoreFields([$p->name, $p->code, $p->address, $p->city, $p->suburb, $p->property_manager_name], $q));
    }

    private function searchPrograms(string $q, User $user): array
    {
        $cols = ['title', 'institution', 'specialization'];
        $count = $this->applyLike(Program::query(), $cols, $q);
        $cand = $this->applyLike(Program::query(), $cols, $q)->orderByDesc('updated_at');

        return $this->collect($count, $cand, fn (Program $p) => [
            'id'       => $p->id,
            'label'    => $p->title,
            'sublabel' => collect([$p->institution, $p->location])->filter()->implode(' · '),
            'url'      => $this->resolveUrl(Program::class, $p, $user),
            'badge'    => $p->status,
        ], fn (Program $p) => $this->scoreFields([$p->title, $p->institution, $p->specialization], $q));
    }

    private function searchSchools(string $q, User $user): array
    {
        $cols = ['name', 'city', 'country'];
        $count = $this->applyLike(School::query(), $cols, $q);
        $cand = $this->applyLike(School::query(), $cols, $q)->orderByDesc('updated_at');

        return $this->collect($count, $cand, fn (School $s) => [
            'id'       => $s->id,
            'label'    => $s->name,
            'sublabel' => collect([$s->city, $s->country])->filter()->implode(', '),
            'url'      => $this->resolveUrl(School::class, $s, $user),
        ], fn (School $s) => $this->scoreFields([$s->name, $s->city, $s->country], $q));
    }

    private function searchEnglishClasses(string $q, User $user): array
    {
        $cols = ['name', 'schedule_text', 'location'];
        $count = $this->applyLike(EnglishClass::query(), $cols, $q);
        $cand = $this->applyLike(EnglishClass::query(), $cols, $q)->orderByDesc('updated_at');

        return $this->collect($count, $cand, fn (EnglishClass $c) => [
            'id'       => $c->id,
            'label'    => $c->name,
            'sublabel' => collect([$c->schedule_text, $c->location])->filter()->implode(' · '),
            'url'      => $this->resolveUrl(EnglishClass::class, $c, $user),
            'badge'    => $c->status,
        ], fn (EnglishClass $c) => $this->scoreFields([$c->name, $c->schedule_text, $c->location], $q));
    }

    private function searchEnglishAssessments(string $q, User $user): array
    {
        $matchesLead = fn (Builder $sub) => $sub->where(
            fn (Builder $w) => $this->applyLike($w, ['first_name', 'last_name', 'email'], $q, [['first_name', 'last_name']])
        );

        $count = EnglishAssessment::query()->whereHas('lead', $matchesLead);
        $cand = EnglishAssessment::with('lead')->whereHas('lead', $matchesLead)->orderByDesc('updated_at');

        return $this->collect($count, $cand, function (EnglishAssessment $a) use ($user) {
            $learner = $a->lead ? trim("{$a->lead->first_name} {$a->lead->last_name}") : 'Unknown';

            return [
                'id'       => $a->id,
                'label'    => "{$learner} — {$a->assessment_type}",
                'sublabel' => collect([optional($a->assessment_date)?->toDateString(), $a->overall_score ? "score {$a->overall_score}" : null])->filter()->implode(' · '),
                'url'      => $this->resolveUrl(EnglishAssessment::class, $a, $user),
            ];
        }, function (EnglishAssessment $a) use ($q) {
            $name = $a->lead ? trim("{$a->lead->first_name} {$a->lead->last_name}") : '';

            return $this->scoreFields([$name, optional($a->lead)->first_name, optional($a->lead)->last_name, optional($a->lead)->email], $q);
        });
    }

    private function searchEoiSubmissions(string $q, User $user): array
    {
        $cols = ['full_legal_name', 'preferred_name', 'email', 'mobile'];
        $count = $this->applyLike(EoiSubmission::query(), $cols, $q);
        $cand = $this->applyLike(EoiSubmission::query(), $cols, $q)->orderByDesc('updated_at');

        return $this->collect($count, $cand, fn (EoiSubmission $e) => [
            'id'       => $e->id,
            'label'    => $e->full_legal_name ?: ($e->preferred_name ?: 'Applicant'),
            'sublabel' => collect([$e->email, $e->status])->filter()->implode(' · '),
            'url'      => $this->resolveUrl(EoiSubmission::class, $e, $user),
            'badge'    => $e->status,
        ], fn (EoiSubmission $e) => $this->scoreFields([$e->full_legal_name, $e->preferred_name, $e->email, $e->mobile], $q));
    }

    private function searchBookings(string $q, User $user): array
    {
        $cols = ['first_name', 'last_name', 'email', 'phone'];
        $pairs = [['first_name', 'last_name']];
        $count = $this->applyLike(Booking::query(), $cols, $q, $pairs);
        $cand = $this->applyLike(Booking::query(), $cols, $q, $pairs)->orderByDesc('updated_at');

        return $this->collect($count, $cand, fn (Booking $b) => [
            'id'       => $b->id,
            'label'    => trim("{$b->first_name} {$b->last_name}") ?: 'Booking',
            'sublabel' => collect([$b->email, $b->service_type, $b->status])->filter()->implode(' · '),
            'url'      => $this->resolveUrl(Booking::class, $b, $user),
            'badge'    => $b->status,
        ], fn (Booking $b) => $this->scoreFields([trim("{$b->first_name} {$b->last_name}"), $b->first_name, $b->last_name, $b->email, $b->phone], $q));
    }

    // ─── URL resolution (role-aware) ──────────────────────────────────────

    public function resolveUrl(string $entityClass, $model, User $user): string
    {
        return match ($entityClass) {
            Lead::class              => $this->leadBase($user) . $model->id,
            Tenant::class            => "/portal/accommodation/tenants/{$model->id}",
            Property::class          => "/portal/accommodation/properties/{$model->id}",
            EoiSubmission::class     => "/portal/accommodation/applications/{$model->id}",
            EnglishClass::class      => "/portal/english/classes/{$model->id}",
            // No standalone assessment detail page — land on the list.
            EnglishAssessment::class => '/portal/english/assessments',
            Program::class           => $this->isEducation($user) ? '/portal/education/programs' : '/admin/programs',
            School::class            => $this->isEducation($user) ? '/portal/education/schools' : '/admin/schools',
            Booking::class           => $user->role === 'sales' ? '/portal/sales/bookings' : '/admin/booking',
            default                  => '/',
        };
    }

    /** Base path for a lead detail in the current user's own portal. */
    private function leadBase(User $user): string
    {
        return match ($user->role) {
            'sales'         => '/portal/sales/leads/',
            'education'     => '/portal/education/leads/',
            'english'       => '/portal/english/leads/',
            'accommodation' => '/portal/accommodation/leads/',
            'immigration', 'immigration_manager', 'immigration_adviser' => '/portal/immigration/leads/',
            default         => '/admin/leads/', // admin, super_admin
        };
    }

    private function isEducation(User $user): bool
    {
        return $user->role === 'education';
    }

    /** Per-module "see all" target with the query pre-applied. */
    private function seeAllUrl(string $entityClass, string $q, User $user): string
    {
        $qs = '?search=' . urlencode($q);

        return match ($entityClass) {
            Lead::class              => rtrim($this->leadBase($user), '/') . $qs,
            Tenant::class            => "/portal/accommodation/tenants{$qs}",
            Property::class          => "/portal/accommodation/properties{$qs}",
            EoiSubmission::class     => "/portal/accommodation/applications{$qs}",
            EnglishClass::class      => "/portal/english/classes{$qs}",
            EnglishAssessment::class => "/portal/english/assessments{$qs}",
            Program::class           => $this->isEducation($user) ? "/portal/education/programs{$qs}" : "/admin/programs{$qs}",
            School::class            => $this->isEducation($user) ? "/portal/education/schools{$qs}" : "/admin/schools{$qs}",
            Booking::class           => $user->role === 'sales' ? "/portal/sales/bookings{$qs}" : "/admin/booking{$qs}",
            default                  => '/',
        };
    }
}
