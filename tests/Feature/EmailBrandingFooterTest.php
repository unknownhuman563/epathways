<?php

namespace Tests\Feature;

use App\Models\EmailBranding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Per-department editable email footer: a department's saved value wins,
 * otherwise the global default. Every field is always present.
 */
class EmailBrandingFooterTest extends TestCase
{
    use RefreshDatabase;

    public function test_defaults_when_no_row(): void
    {
        $f = EmailBranding::resolveFooter('immigration');

        $this->assertSame('ePathways', $f['company']);
        $this->assertArrayHasKey('email', $f);
        $this->assertArrayHasKey('whatsapp', $f);
        $this->assertArrayHasKey('location', $f);
        $this->assertArrayHasKey('website_url', $f);
    }

    public function test_department_overrides_win_per_field(): void
    {
        EmailBranding::create([
            'department' => 'immigration',
            'footer_company' => 'ePathways Immigration',
            'footer_email' => 'migration@epathways.co.nz',
            'footer_whatsapp' => '+64 27 532 6989 Eireen',
            'footer_location' => '15 Mercari Way, Albany, Auckland 0632, New Zealand',
            // website + label left blank → fall back to default.
        ]);

        $f = EmailBranding::resolveFooter('immigration');

        $this->assertSame('ePathways Immigration', $f['company']);
        $this->assertSame('migration@epathways.co.nz', $f['email']);
        $this->assertSame('+64 27 532 6989 Eireen', $f['whatsapp']);
        $this->assertStringContainsString('Mercari Way', $f['location']);
        // Blank field falls back to the default (not empty).
        $this->assertNotSame('', $f['website_url']);

        // A different department without a row still gets the defaults.
        $this->assertSame('ePathways', EmailBranding::resolveFooter('education')['company']);
    }
}
