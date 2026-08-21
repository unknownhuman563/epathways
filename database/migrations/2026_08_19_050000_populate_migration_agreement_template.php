<?php

use App\Models\MessageTemplate;
use Illuminate\Database\Migrations\Migration;

/**
 * Populate the editable `migration_agreement` email template with the real
 * engagement-agreement content (ported from the hardcoded Blade email
 * resources/views/emails/engagement-documents.blade.php), replacing the old
 * placeholder note so staff can view/edit it from the Email Templates UI.
 *
 * The banner + footer come from the Immigration branding shell; {{first_name}}
 * and {{tracker_url}} are filled per-lead on send. This does NOT change the
 * hardcoded Blade send path — it just makes the content exist as a template.
 */
return new class extends Migration
{
    public function up(): void
    {
        $body = <<<'HTML'
<p>Dear <strong>{{first_name}}</strong>,</p>
<p>Thank you for choosing D Immigration Consultancy Limited to assist you with your New Zealand visa application.</p>
<p>We&rsquo;re delighted to have you with us and look forward to guiding you through every step of the process. Our commitment is to provide you with clear advice, honest communication, and professional support throughout your immigration journey.</p>
<p style="color:#137C86;font-weight:700;">To formally begin your engagement, please find the following documents attached:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tbody>
<tr>
<td width="50%" valign="top" align="center" style="padding:14px 12px;">
<img src="https://epathways.co.nz/images/email/engagement/written-agreement.png" alt="Engagement Agreement" width="88" height="88" style="display:block;margin:0 auto 8px;">
<p style="font-weight:700;color:#137C86;margin:0 0 4px;">Engagement Agreement</p>
<p style="font-size:12px;color:#555555;margin:0;">The written agreement outlining our services, responsibilities, fees and terms of engagement.</p>
</td>
<td width="50%" valign="top" align="center" style="padding:14px 12px;">
<img src="https://epathways.co.nz/images/email/engagement/code-of-conduct.png" alt="Code of Conduct" width="88" height="88" style="display:block;margin:0 auto 8px;">
<p style="font-weight:700;color:#137C86;margin:0 0 4px;">Licensed Immigration Advisers Code of Conduct 2014</p>
<p style="font-size:12px;color:#555555;margin:0;">The professional standards and code of conduct all Licensed Immigration Advisers in New Zealand are required to follow.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top" align="center" style="padding:14px 12px;">
<img src="https://epathways.co.nz/images/email/engagement/professional-standards.png" alt="Professional Standards" width="88" height="88" style="display:block;margin:0 auto 8px;">
<p style="font-weight:700;color:#137C86;margin:0 0 4px;">Licensed Immigration Advisers Professional Standards</p>
<p style="font-size:12px;color:#555555;margin:0;">A summary of the standards that underpin the immigration advice you receive.</p>
</td>
<td width="50%" valign="top" align="center" style="padding:14px 12px;">
<img src="https://epathways.co.nz/images/email/engagement/complaints-procedure.png" alt="Complaints Procedure" width="88" height="88" style="display:block;margin:0 auto 8px;">
<p style="font-weight:700;color:#137C86;margin:0 0 4px;">Complaints Procedure &ndash; D Immigration Consultancy Limited</p>
<p style="font-size:12px;color:#555555;margin:0;">This explains our internal complaints process and your options and next steps.</p>
</td>
</tr>
</tbody></table>
<p>Please take a few moments to read these documents. You can open them any time on your personal application tracker using the button below &mdash; no login required.</p>
<p style="text-align:center;"><a href="{{engagement_url}}" target="_blank" style="display:inline-block;padding:13px 30px;background-color:#137C86;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;">Open my documents</a></p>
<p>Once you&rsquo;re happy to proceed, please sign and return the Engagement Agreement. Upon receipt, we&rsquo;ll provide you with the next steps and a personalised document checklist so we can begin preparing your visa application.</p>
<p>Thank you again for placing your trust in us. We look forward to helping you achieve your New Zealand goals.</p>
HTML;

        MessageTemplate::withTrashed()->updateOrCreate(
            ['key' => 'migration_agreement', 'department' => ''],
            [
                'name' => '06 - Send Agreement (CLIENT)',
                'channels' => ['email'],
                'email_subject' => 'ACTION REQUIRED: Please Review and Sign Your Engagement Agreement',
                'email_body' => $body,
                'branding' => 'immigration',
                'is_active' => true,
                'deleted_at' => null,
            ],
        );
    }

    public function down(): void
    {
        // Intentionally irreversible: we don't restore the old placeholder note.
    }
};
