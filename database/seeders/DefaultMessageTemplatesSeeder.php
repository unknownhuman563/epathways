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
                'key' => 'program_proposal',
                'name' => 'Study Proposal',
                'description' => 'Sent from Proposal & Agreements → Notify. Presents the up-to-3 suggested programs and the ePathways study-support pitch.',
                'channels' => ['email'],
                'email_subject' => 'Proposal for Study Options in New Zealand — ePathways',
                'from_email' => 'hello@epathways.ph',
                'from_name' => 'ePathways Philippines',
                'email_body' => $this->studyProposalBody(),
                'variables_documented' => array_merge($standardVars, [
                    ['name' => 'program_1', 'description' => 'First suggested program (title · level · fee)'],
                    ['name' => 'program_2', 'description' => 'Second suggested program (blank if none)'],
                    ['name' => 'program_3', 'description' => 'Third suggested program (blank if none)'],
                ]),
            ],
            [
                'key' => 'consultancy_agreement',
                'name' => 'Consultancy Agreement',
                'description' => 'Sent from Proposal & Agreements → Notify on any consultancy/English agreement. Points the lead at their tracker to review and sign.',
                'channels' => ['email'],
                'email_subject' => 'Your Consultancy Agreement with ePathways is ready',
                'from_email' => 'hello@epathways.ph',
                'from_name' => 'ePathways Philippines',
                'email_body' => $this->consultancyAgreementBody(),
                'variables_documented' => $standardVars,
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
            $t['department'] = $t['department'] ?? '';   // '' = shared/global
            MessageTemplate::updateOrCreate(
                ['key' => $t['key'], 'department' => $t['department']],
                $t,
            );
        }

        $this->seedDepartmentStatusUpdates($standardVars);
    }

    /**
     * HTML body for the Study Proposal email. Rendered raw inside the branded
     * shell (banner + footer contact come from the shell, not this body).
     * Program lines use plain-text {{program_N}} vars because the templating
     * layer HTML-escapes substituted values.
     */
    private function studyProposalBody(): string
    {
        return <<<'HTML'
<p style="text-align:center;font-weight:700;font-size:16px;color:#2e7d32;margin:0 0 18px;">Proposal for Study Options in New Zealand</p>
<p style="font-weight:700;">Kia Ora {{first_name}},</p>
<p>Further to our recent discussion, we are pleased to present a tailored selection of programme options aligned with your qualifications. Each option includes key details on programme duration and indicative total tuition fees for your consideration.</p>
<p>At ePathways, we are committed to guiding you toward high-quality education pathways in New Zealand. Thank you for your interest in advancing your academic journey with us. The programmes outlined below are carefully selected to support your ambitions and position you for long-term success in an increasingly global career landscape.</p>
<p style="font-weight:700;color:#2e7d32;font-size:15px;margin-top:22px;">Why Study in New Zealand?</p>
<ul>
<li><strong>Partner Work Opportunities</strong> &mdash; Your partner may be eligible for an Open Work Visa, enabling full-time employment with any employer across a wide range of roles.</li>
<li><strong>Education Benefits for Your Children</strong> &mdash; Dependent children aged 5&ndash;19 may qualify for access to domestic schooling, significantly reducing education costs.</li>
<li><strong>Flexible Work While Studying</strong> &mdash; Students may be eligible to work while studying, with full-time work rights during scheduled breaks (subject to programme conditions).</li>
<li><strong>Post-Study Work Opportunities</strong> &mdash; Graduates may qualify for a Post-Study Work Visa of up to 3 years, providing valuable New Zealand work experience.</li>
<li><strong>Pathway to Residency</strong> &mdash; Study pathways can support long-term migration goals, including potential eligibility for residency under relevant immigration categories.</li>
</ul>
<p style="font-weight:700;color:#2e7d32;font-size:15px;margin-top:22px;">Recommended Programs</p>
<p style="margin:4px 0;"><strong>Option 1:</strong> {{program_1}}</p>
<p style="margin:4px 0;"><strong>Option 2:</strong> {{program_2}}</p>
<p style="margin:4px 0;"><strong>Option 3:</strong> {{program_3}}</p>
<p style="font-weight:700;color:#2e7d32;font-size:15px;margin-top:22px;">Why Choose ePathways?</p>
<p>At ePathways, we go beyond just processing applications &mdash; we provide <strong>end-to-end personalised support</strong> to ensure a smooth and successful journey to New Zealand.</p>
<p style="margin-bottom:4px;"><strong>We offer:</strong></p>
<ul>
<li><strong>Expert course and eligibility guidance</strong> tailored to your goals from our Licensed Immigration Advisers</li>
<li><strong>Fast and accurate application processing</strong></li>
<li><strong>Dedicated student visa support</strong> with up-to-date immigration advice</li>
<li><strong>Pre-departure orientation</strong> to fully prepare you for life in New Zealand</li>
</ul>
<p style="margin-bottom:4px;"><strong>Our Student Support Services:</strong></p>
<ul>
<li><strong>FREE Airport Pick-Up</strong> &mdash; so you arrive safely and stress-free</li>
<li><strong>Accommodation Assistance</strong> &mdash; we help you secure safe and suitable housing before arrival</li>
<li><strong>Bank Account Setup</strong> &mdash; quick and easy financial setup</li>
<li><strong>IRD Number Support</strong> &mdash; so you can start working as soon as possible</li>
<li><strong>Insurance Assistance</strong> &mdash; ensuring you are covered from day one</li>
</ul>
<p style="margin-bottom:4px;"><strong>What Makes Us Different:</strong></p>
<ul>
<li><strong>Ongoing support after arrival</strong> &mdash; we don't stop once you land</li>
<li><strong>Local presence in New Zealand</strong> &mdash; real support when you need it</li>
<li><strong>Student-focused approach</strong> &mdash; we prioritise your success, not just your application</li>
<li><strong>Trusted network</strong> &mdash; strong relationships with institutions and student communities</li>
</ul>
<p>Please feel free to reach out if you require any further information or wish to proceed with applications. You can review these options any time on your personal tracker &mdash; no login required:</p>
<p style="text-align:center;"><a href="{{tracker_url}}" style="display:inline-block;padding:12px 26px;background:#2e7d32;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;">View my study options</a></p>
<p style="text-align:center;font-weight:700;margin-top:20px;">At ePathways, our purpose is simple:<br>We help you succeed by guiding you toward the right pathways, turning your New Zealand study dreams into reality.</p>
HTML;
    }

    /**
     * HTML body for the Consultancy Agreement email. The portal link is
     * {{tracker_url}} — never a hardcoded /track/CODE URL, or every recipient
     * lands on one lead's tracker.
     */
    private function consultancyAgreementBody(): string
    {
        $button = 'display:inline-block;padding:12px 26px;background:#2e7d32;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;';
        $booking = 'https://go.epathways.co.nz/widget/bookings/meet-with-bryll-emma';

        return <<<HTML
<p style="font-weight:700;color:#2e7d32;">Kia Ora {{first_name}},</p>
<p>Your Consultancy Agreement is now available for review on your ePathways portal.</p>
<p>Please use the link below to view the document &mdash; no login required:</p>
<p style="text-align:center;"><a href="{{tracker_url}}" style="{$button}">View my agreement</a></p>
<p>Once you have reviewed the agreement, kindly sign it through the portal to confirm your acceptance so we can proceed with the next steps in your application.</p>
<p>If you would like to meet with Bryll virtually to walk through the agreement, you may book a consultation here:</p>
<p style="text-align:center;"><a href="{$booking}" style="{$button}">Book a consultation</a></p>
HTML;
    }

    /**
     * Give every department a starter "application status update" template it
     * can edit. Staff send these manually from a lead to tell the customer
     * their application has moved forward.
     */
    private function seedDepartmentStatusUpdates(array $standardVars): void
    {
        $statusVars = array_merge($standardVars, [
            ['name' => 'status', 'description' => 'The new application status'],
            ['name' => 'status_detail', 'description' => 'Optional note describing the change'],
        ]);

        foreach (MessageTemplate::DEPARTMENTS as $department) {
            $label = ucfirst($department);

            MessageTemplate::updateOrCreate(
                ['key' => 'application_status_update', 'department' => $department],
                [
                    'name' => "{$label} — Application Status Update",
                    'description' => "Manual update staff send a {$label} lead when their application status changes.",
                    'channels' => ['email'],
                    'email_subject' => 'An update on your ePathways application',
                    'email_body' => "# An update on your application, {{first_name}}\n\nThere's been an update on your application with our {$label} team.\n\n**Current status:** {{status}}\n\n{{status_detail}}\n\nYou can see the latest at any time on your tracker — no login required:\n\n[Open my tracker]({{tracker_url}})\n\nIf you have any questions, just reply to this email and {{assigned_staff_name}} will help.\n\nNgā mihi,\nThe ePathways team",
                    'sms_body' => 'Hi {{first_name}}, an update on your ePathways application — status: {{status}}. Details: {{tracker_url}}',
                    'variables_documented' => $statusVars,
                ],
            );
        }
    }
}
