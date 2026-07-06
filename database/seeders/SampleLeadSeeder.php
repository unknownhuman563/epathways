<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Lead;
use App\Models\LeadNote;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Sample leads so the shared Leads table (Sales / Education / Immigration
 * portals) has something to click through — covering every column the
 * redesign added: Priority, merged Contact, Location, latest Note, and the
 * "Updated · by staff" caption. Also seeds:
 *   - a batch of Registration-source leads (visible under the Registration tab)
 *   - a sample Event with registrants (visible under the Events tab)
 *
 * SAFETY: refuses to run in production. Every sample lead carries a 'SMPL-'
 * lead_id prefix (and the event a 'SMPL-EVT' code) so re-running replaces the
 * demo set instead of duplicating, and cleanup never touches real records.
 *
 *   php artisan db:seed --class=SampleLeadSeeder
 */
class SampleLeadSeeder extends Seeder
{
    /** Staff member the "Updated by" caption / note author is attributed to. */
    private ?User $staff = null;

    private ?Carbon $now = null;

    public function run(): void
    {
        // Hard stop on production — sample data must never reach the live DB.
        if (app()->isProduction()) {
            $this->command?->warn('SampleLeadSeeder skipped: refusing to seed sample leads in production.');

            return;
        }

        $this->staff = User::whereIn('role', ['sales', 'education', 'immigration', 'admin', 'super_admin'])
            ->orderBy('id')->first();
        $this->now = Carbon::now();

        // Idempotent cleanup — every sample lead carries a SMPL- lead_id prefix
        // regardless of source, so this catches pipeline + registration + event
        // rows without ever matching a real lead.
        foreach (Lead::withTrashed()->where('lead_id', 'like', 'SMPL-%')->get() as $old) {
            $old->notes()->delete();
            $old->forceDelete();
        }
        Event::where('event_code', 'like', 'SMPL-EVT%')->get()->each->delete();

        $pipeline = $this->seedPipelineLeads();
        $registration = $this->seedRegistrationLeads();
        $event = $this->seedEventWithRegistrants();

        $this->command?->info(
            "Seeded {$pipeline} pipeline leads, {$registration} registration leads, "
            ."and 1 event with {$event} registrants."
        );
    }

    /** Open-opportunity pipeline leads (Open opportunities tab). */
    private function seedPipelineLeads(): int
    {
        $samples = [
            ['first_name' => 'Aroha',   'last_name' => 'Ngata',      'email' => 'aroha.ngata@example.com',      'phone' => '+64 21 555 0101', 'city' => 'Auckland',     'country' => 'New Zealand',  'status' => 'New Leads',              'priority' => 'urgent', 'note' => 'Called twice, no answer — will try WhatsApp tomorrow.'],
            ['first_name' => 'Diego',   'last_name' => 'Fernandez',  'email' => 'diego.fernandez@example.com',  'phone' => '+63 917 555 0102', 'city' => 'Manila',       'country' => 'Philippines', 'status' => 'Contact Attempted',      'priority' => 'medium', 'note' => 'Interested in the Level 7 Business Diploma. Sent brochure.'],
            ['first_name' => 'Priya',   'last_name' => 'Sharma',     'email' => 'priya.sharma@example.com',     'phone' => '+91 98765 55003', 'city' => 'Mumbai',       'country' => 'India',       'status' => 'Qualified',              'priority' => 'urgent', 'note' => 'Funds confirmed. Booking consultation for Friday.'],
            ['first_name' => 'Chen',    'last_name' => 'Wei',        'email' => 'chen.wei@example.com',         'phone' => '+86 138 5550 104', 'city' => 'Shanghai',     'country' => 'China',       'status' => 'Booked Consultation',    'priority' => 'medium', 'note' => 'Consultation booked for 12 Jul, 2pm NZST.'],
            ['first_name' => 'Sofia',   'last_name' => 'Rossi',      'email' => 'sofia.rossi@example.com',      'phone' => '+39 320 555 0105', 'city' => 'Milan',        'country' => 'Italy',       'status' => 'Consultation Done',      'priority' => 'low',    'note' => 'Consultation done — leaning towards English Pro pathway.'],
            ['first_name' => 'James',   'last_name' => 'Okafor',     'email' => 'james.okafor@example.com',     'phone' => '+234 803 555 0106', 'city' => 'Lagos',        'country' => 'Nigeria',     'status' => 'Proposal Sent',          'priority' => 'medium', 'note' => 'Proposal emailed. Awaiting decision by end of week.'],
            ['first_name' => 'Mai',     'last_name' => 'Nguyen',     'email' => 'mai.nguyen@example.com',       'phone' => '+84 90 555 0107',  'city' => 'Hanoi',        'country' => 'Vietnam',     'status' => 'Consultancy Agreement',  'priority' => 'urgent', 'note' => 'Agreement signed. Moving to school enrollment.'],
            ['first_name' => 'Lucas',   'last_name' => 'Silva',      'email' => 'lucas.silva@example.com',      'phone' => '+55 11 95555 0108', 'city' => 'Sao Paulo',    'country' => 'Brazil',      'status' => 'School Enrollment',      'priority' => null,     'note' => 'Enrolled at partner institute. Visa docs next.'],
            ['first_name' => 'Fatima',  'last_name' => 'Al-Rashid',  'email' => 'fatima.alrashid@example.com',  'phone' => '+971 50 555 0109', 'city' => 'Dubai',        'country' => 'UAE',         'status' => 'Visa Process',           'priority' => 'medium', 'note' => 'Visa application lodged with INZ.'],
            ['first_name' => 'Ravi',    'last_name' => 'Patel',      'email' => 'ravi.patel@example.com',       'phone' => '+91 99887 55010', 'city' => 'Ahmedabad',    'country' => 'India',       'status' => 'Contacted for Booking',  'priority' => 'low',    'note' => 'Prefers an evening call — following up.'],
            ['first_name' => 'Emma',    'last_name' => 'Thompson',   'email' => 'emma.thompson@example.com',    'phone' => '+44 7700 955011', 'city' => 'Manchester',   'country' => 'United Kingdom', 'status' => 'Qualified but No Funds', 'priority' => 'low',  'note' => 'Qualified but needs 3 months to arrange funds.'],
            ['first_name' => 'Kwame',   'last_name' => 'Mensah',     'email' => 'kwame.mensah@example.com',     'phone' => '+233 24 555 0112', 'city' => 'Accra',        'country' => 'Ghana',       'status' => 'No Show',                'priority' => 'medium', 'note' => 'Missed consultation — rescheduling.'],
            ['first_name' => 'Yuki',    'last_name' => 'Tanaka',     'email' => 'yuki.tanaka@example.com',      'phone' => '+81 90 5555 0113', 'city' => 'Osaka',        'country' => 'Japan',       'status' => 'New Leads',              'priority' => null,     'note' => 'Web enquiry via Education Journey page.'],
            ['first_name' => 'Isabella','last_name' => 'Garcia',     'email' => 'isabella.garcia@example.com',  'phone' => '+34 612 555 014',  'city' => 'Madrid',       'country' => 'Spain',       'status' => 'Work Pathway / Other',   'priority' => 'low',    'note' => 'Exploring post-study work options.'],
            ['first_name' => 'Ahmed',   'last_name' => 'Hassan',     'email' => 'ahmed.hassan@example.com',     'phone' => '+20 100 555 0115', 'city' => 'Cairo',        'country' => 'Egypt',       'status' => 'Qualified but Not Ready','priority' => null,     'note' => 'Planning for next intake. Keep warm.'],
        ];

        foreach ($samples as $i => $s) {
            $this->makeLead('SMPL-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT), $s, 'sample_seed', $i, count($samples));
        }

        return count($samples);
    }

    /** Leads captured via the public /register form (Registration tab). */
    private function seedRegistrationLeads(): int
    {
        $samples = [
            ['first_name' => 'Nadia',  'last_name' => 'Karimi',   'email' => 'nadia.karimi@example.com',   'phone' => '+93 70 555 0201', 'city' => 'Kabul',      'country' => 'Afghanistan', 'status' => 'New Leads',         'priority' => 'medium', 'note' => 'Registered via public form — study interest: nursing.'],
            ['first_name' => 'Tomas',  'last_name' => 'Novak',    'email' => 'tomas.novak@example.com',    'phone' => '+420 601 55 0202','city' => 'Prague',     'country' => 'Czechia',     'status' => 'Contact Attempted', 'priority' => 'low',    'note' => 'Registration form completed. Awaiting first call.'],
            ['first_name' => 'Grace',  'last_name' => 'Adeyemi',  'email' => 'grace.adeyemi@example.com',  'phone' => '+234 802 55 0203','city' => 'Abuja',      'country' => 'Nigeria',     'status' => 'New Leads',         'priority' => 'urgent', 'note' => 'Registered — flagged urgent, visa expiring soon.'],
            ['first_name' => 'Ling',   'last_name' => 'Zhao',     'email' => 'ling.zhao@example.com',      'phone' => '+86 139 5550 204','city' => 'Chengdu',    'country' => 'China',       'status' => 'Qualified',         'priority' => null,     'note' => 'Registration reviewed — good fit for Level 7.'],
        ];

        foreach ($samples as $i => $s) {
            $this->makeLead('SMPL-R'.str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT), $s, 'registration', $i, count($samples));
        }

        return count($samples);
    }

    /** A sample event plus the leads who registered for it (Events tab). */
    private function seedEventWithRegistrants(): int
    {
        $event = Event::create([
            'name'       => 'Sample — NZ Study & Migration Expo',
            'description' => 'Demo event seeded for the Events tab.',
            'type'       => 'Seminar',
            'event_code' => 'SMPL-EVT1',
            'date_from'  => $this->now->copy()->addDays(21)->toDateString(),
            'status'     => 'published',
            'mode'       => 'in_person',
            'location'   => 'Auckland CBD, New Zealand',
        ]);

        $samples = [
            ['first_name' => 'Oliver', 'last_name' => 'Brown',   'email' => 'oliver.brown@example.com',  'phone' => '+64 21 555 0301', 'city' => 'Wellington', 'country' => 'New Zealand', 'status' => 'New Leads',         'priority' => 'medium', 'note' => 'Registered for the expo — interested in AEWV.'],
            ['first_name' => 'Ananya', 'last_name' => 'Iyer',    'email' => 'ananya.iyer@example.com',   'phone' => '+91 90000 55302', 'city' => 'Bengaluru',  'country' => 'India',       'status' => 'Contact Attempted', 'priority' => 'urgent', 'note' => 'Expo registrant — wants a 1:1 at the booth.'],
            ['first_name' => 'Marco',  'last_name' => 'Bianchi', 'email' => 'marco.bianchi@example.com', 'phone' => '+39 333 555 0303','city' => 'Rome',       'country' => 'Italy',       'status' => 'New Leads',         'priority' => 'low',    'note' => 'Registered — post-study work pathway questions.'],
            ['first_name' => 'Hana',   'last_name' => 'Kim',     'email' => 'hana.kim@example.com',      'phone' => '+82 10 5555 0304','city' => 'Seoul',      'country' => 'South Korea', 'status' => 'New Leads',         'priority' => null,     'note' => 'Expo registrant — English Pro enquiry.'],
        ];

        foreach ($samples as $i => $s) {
            $this->makeLead('SMPL-E'.str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT), $s, 'event', $i, count($samples), [
                'event_id'    => $event->id,
                'event_notes' => $s['note'],
            ]);
        }

        return count($samples);
    }

    /**
     * Create one sample lead + its latest internal note, with backdated
     * timestamps so the "Updated" column shows a spread.
     */
    private function makeLead(string $leadId, array $s, string $source, int $i, int $total, array $extra = []): void
    {
        $updatedAt = $this->now->copy()->subDays($total - $i)->subHours($i);

        $lead = new Lead(array_merge([
            'lead_id'            => $leadId,
            'first_name'         => $s['first_name'],
            'last_name'          => $s['last_name'],
            'email'              => $s['email'],
            'phone'              => $s['phone'],
            'residence_city'     => $s['city'],
            'residence_country'  => $s['country'],
            'status'             => $s['status'],
            'stage'              => $s['status'],
            'priority'           => $s['priority'],
            'source'             => $source,
            'stage_updated_at'   => $updatedAt,
            'stage_updated_by'   => $this->staff?->id,
        ], $extra));
        $lead->save();

        $lead->forceFill([
            'created_at' => $this->now->copy()->subDays($total - $i + 5),
            'updated_at' => $updatedAt,
        ])->saveQuietly();

        LeadNote::create([
            'lead_id'     => $lead->id,
            'user_id'     => $this->staff?->id,
            'author_name' => $this->staff?->name ?: 'System',
            'author_role' => $this->staff?->role,
            'body'        => $s['note'],
            'kind'        => 'general',
        ]);
    }
}
