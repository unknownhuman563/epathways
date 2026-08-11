<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * A passive record that a staff member opened a case or one of its documents
 * (Build 12 phase 4, §5). No user action, no self-reporting. Written throttled
 * (one per user per case per 15 min) so a page refresh or a quick back-and-forth
 * doesn't inflate the trail.
 *
 * The attention signal is drawn from LICENSED-user views only — "has the adviser
 * looked?" — so an unlicensed staffer opening the case never reads as reviewed.
 * duration_s exists in the schema but is never surfaced (§5, narrowed).
 */
class CaseView extends Model
{
    /** Minutes within which a repeat open by the same user is not re-recorded. */
    public const THROTTLE_MINUTES = 15;

    protected $fillable = ['lead_id', 'user_id', 'opened_at', 'duration_s'];

    protected $casts = [
        'opened_at' => 'datetime',
        'duration_s' => 'integer',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record an open, throttled to one row per (user, case) per 15 minutes.
     * Returns the new row, or null if a recent open already covers this window.
     */
    public static function recordOpen(int $leadId, int $userId): ?self
    {
        $recent = static::where('lead_id', $leadId)
            ->where('user_id', $userId)
            ->where('opened_at', '>=', now()->subMinutes(self::THROTTLE_MINUTES))
            ->exists();

        if ($recent) {
            return null;
        }

        return static::create([
            'lead_id' => $leadId,
            'user_id' => $userId,
            'opened_at' => now(),
        ]);
    }

    /**
     * Constrain a query to views by a user who holds a current IAA licence —
     * mirrors User::holdsCurrentLicence() at the SQL level (non-empty number +
     * a future expiry).
     *
     * @param  Builder<CaseView>  $query
     * @return Builder<CaseView>
     */
    public function scopeByLicensedUser(Builder $query): Builder
    {
        return $query->whereExists(function ($sub) {
            $sub->selectRaw('1')
                ->from('users')
                ->whereColumn('users.id', 'case_views.user_id')
                ->whereNotNull('users.iaa_licence_number')
                ->where('users.iaa_licence_number', '!=', '')
                ->whereNotNull('users.iaa_licence_expiry')
                ->where('users.iaa_licence_expiry', '>', now());
        });
    }

    /**
     * The latest licensed-user open per case — the board's attention signal.
     * Pass lead ids to constrain; omit for all cases.
     *
     * @param  array<int, int>|null  $leadIds
     * @return Collection<int, \Illuminate\Support\Carbon> keyed by lead_id
     */
    public static function latestLicensedOpens(?array $leadIds = null): Collection
    {
        return static::query()
            ->byLicensedUser()
            ->when($leadIds !== null, fn ($q) => $q->whereIn('lead_id', $leadIds))
            ->selectRaw('lead_id, MAX(opened_at) as last_opened')
            ->groupBy('lead_id')
            ->pluck('last_opened', 'lead_id')
            ->map(fn ($v) => $v instanceof \Illuminate\Support\Carbon ? $v : \Illuminate\Support\Carbon::parse($v));
    }

    /** This user's most recent open of a case (their previous visit). */
    public static function lastOpenedBy(int $leadId, int $userId): ?self
    {
        return static::where('lead_id', $leadId)
            ->where('user_id', $userId)
            ->latest('opened_at')
            ->first();
    }
}
