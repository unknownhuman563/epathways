<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Models\VisaType;
use App\Models\VisaTypePriceHistory;
use App\Notifications\DocumentSubmittedForReview;
use App\Notifications\LeadAssignedToYou;
use App\Notifications\VisaTypePriceChanged;
use Illuminate\Console\Command;

/**
 * Fire a sample notification at a user for manual verification of the
 * read path (badge → dropdown → page). Sample data only — handy for
 * eyeballing formatting and for future debugging.
 *
 *   php artisan ep:test-notification jane@example.com assignment
 *   php artisan ep:test-notification jane@example.com document
 *   php artisan ep:test-notification jane@example.com price-change
 */
class TestNotification extends Command
{
    protected $signature = 'ep:test-notification {email} {type=assignment : assignment|document|price-change}';

    protected $description = 'Send a sample in-app notification to a user for manual verification.';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error("No user with email {$this->argument('email')}.");

            return self::FAILURE;
        }

        $type = $this->argument('type');
        $notification = match ($type) {
            'assignment'   => new LeadAssignedToYou($this->sampleLead(), $user->id, 'System (test)'),
            'document'     => new DocumentSubmittedForReview($this->sampleLead(), $this->sampleDocument()),
            'price-change' => new VisaTypePriceChanged($this->sampleVisaType(), $this->samplePriceEntry($user), 'System (test)'),
            default        => null,
        };

        if (! $notification) {
            $this->error("Unknown type '{$type}'. Use: assignment | document | price-change.");

            return self::FAILURE;
        }

        $user->notify($notification);
        $this->info("Sent '{$type}' notification to {$user->email}.");

        return self::SUCCESS;
    }

    private function sampleLead(): Lead
    {
        return Lead::first() ?? new Lead(['first_name' => 'Sample', 'last_name' => 'Lead']);
    }

    private function sampleDocument(): LeadDocument
    {
        return LeadDocument::first() ?? new LeadDocument([
            'original_name' => 'sample-passport.pdf',
            'checklist_key' => 'passport',
        ]);
    }

    private function sampleVisaType(): VisaType
    {
        return VisaType::first() ?? new VisaType(['name' => 'Sample Visa']);
    }

    private function samplePriceEntry(User $user): VisaTypePriceHistory
    {
        return new VisaTypePriceHistory([
            'old_price_nzd'      => 250,
            'new_price_nzd'      => 300,
            'changed_by_user_id' => $user->id,
            'reason'             => 'Test price change',
        ]);
    }
}
