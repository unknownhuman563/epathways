<?php

namespace Database\Seeders;

use App\Models\MessageTemplate;
use Illuminate\Database\Seeder;

/**
 * Seeds the baseline message templates that mirror the hand-written
 * Mailables. Idempotent (keyed by `key`), so it's safe to re-run.
 */
class DefaultMessageTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $standardVars = [
            ['name' => 'first_name', 'description' => "Lead's first name"],
            ['name' => 'full_name', 'description' => "Lead's full name"],
            ['name' => 'tracker_url', 'description' => 'Link to the lead /track/{code} page'],
            ['name' => 'assigned_staff_name', 'description' => 'Assigned staff member, or "the ePathways team"'],
        ];

        $templates = [
            [
                'key' => 'tracker_welcome',
                'name' => 'Tracker Welcome',
                'description' => 'First-touch email giving a lead their tracker link.',
                'channels' => ['email'],
                'email_subject' => 'Track your ePathways application',
                'email_body' => "# Track your ePathways application, {{first_name}}\n\nEverything for your application now lives in one place — your personal tracker. There's **no login**: just keep the link below safe.\n\n- See your progress at a glance\n- Upload the documents we ask for\n- Keep your details up to date\n\n[Open my tracker]({{tracker_url}})\n\nIf the button doesn't work, paste this URL into your browser:\n\n{{tracker_url}}\n\nNgā mihi,\nThe ePathways team",
                'variables_documented' => $standardVars,
            ],
            [
                'key' => 'doc_request',
                'name' => 'Document Requested',
                'description' => 'Tells a lead which document staff need, linking to their tracker.',
                'channels' => ['email', 'sms'],
                'email_subject' => 'ePathways needs your {{document_name}}',
                'email_body' => "# We need a document from you, {{first_name}}\n\nTo keep your application moving, our team has requested:\n\n**{{document_name}}**\n\nYou can upload it securely from your tracker — no login required:\n\n[Upload my document]({{tracker_url}})\n\n{{tracker_url}}\n\nNgā mihi,\nThe ePathways team",
                'sms_body' => 'ePathways needs your {{document_name}}. Upload it here (no login): {{tracker_url}}',
                'variables_documented' => array_merge($standardVars, [['name' => 'document_name', 'description' => 'The requested document label']]),
            ],
            [
                'key' => 'doc_approved',
                'name' => 'Document Approved',
                'description' => 'Confirms to a lead that a submitted document was approved.',
                'channels' => ['email', 'sms'],
                'email_subject' => 'Your ePathways document was approved',
                'email_body' => "# An update on your document, {{first_name}}\n\nGood news — your document **{{document_name}}** has been **approved**. No further action is needed for this one.\n\n[Open my tracker]({{tracker_url}})\n\nNgā mihi,\nThe ePathways team",
                'sms_body' => 'Good news {{first_name}} — your ePathways document "{{document_name}}" was approved.',
                'variables_documented' => array_merge($standardVars, [['name' => 'document_name', 'description' => 'The reviewed document name']]),
            ],
            [
                'key' => 'doc_rejected',
                'name' => 'Document Rejected',
                'description' => 'Tells a lead a document needs attention, with the reason.',
                'channels' => ['email', 'sms'],
                'email_subject' => 'Your ePathways document needs attention',
                'email_body' => "# An update on your document, {{first_name}}\n\nYour document **{{document_name}}** **needs attention** and couldn't be accepted as-is.\n\n**Reason:** {{reason}}\n\nPlease re-upload a corrected version from your tracker:\n\n[Open my tracker]({{tracker_url}})\n\nNgā mihi,\nThe ePathways team",
                'sms_body' => 'Your ePathways document "{{document_name}}" needs attention. {{reason}} Re-upload: {{tracker_url}}',
                'variables_documented' => array_merge($standardVars, [
                    ['name' => 'document_name', 'description' => 'The reviewed document name'],
                    ['name' => 'reason', 'description' => 'Why the document was rejected'],
                ]),
            ],
            [
                'key' => 'portal_invitation',
                'name' => 'Portal Invitation (legacy)',
                'description' => 'Reference template. The live send still uses the LeadPortalInvitation Mailable because the setup link is a signed, single-use token generated in code.',
                'channels' => ['email'],
                'email_subject' => 'Your ePathways portal access is ready',
                'email_body' => "# Welcome to your ePathways portal, {{first_name}}\n\nWe've set up secure portal access for you. The activation link is sent separately for security.\n\nNgā mihi,\nThe ePathways team",
                'variables_documented' => $standardVars,
            ],
        ];

        foreach ($templates as $t) {
            MessageTemplate::updateOrCreate(['key' => $t['key']], $t);
        }
    }
}
