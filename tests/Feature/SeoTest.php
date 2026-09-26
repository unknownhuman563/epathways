<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Support\Seo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Fix the canonical base so assertions are host-independent.
        config(['app.canonical_url' => 'https://luvep.com']);
    }

    /** Pull the <title> text out of a rendered HTML document. */
    private function title(string $html): ?string
    {
        return preg_match('/<title>(.*?)<\/title>/s', $html, $m) ? html_entity_decode(trim($m[1])) : null;
    }

    /** Pull the href of the canonical <link> out of a rendered HTML document. */
    private function canonical(string $html): ?string
    {
        return preg_match('/<link rel="canonical" href="([^"]+)"/', $html, $m) ? $m[1] : null;
    }

    /** Decode every application/ld+json block into PHP arrays. */
    private function jsonLdBlocks(string $html): array
    {
        preg_match_all('/<script type="application\/ld\+json">(.*?)<\/script>/s', $html, $m);

        return array_map(fn ($json) => json_decode($json, true), $m[1]);
    }

    public function test_home_title_and_description_exist_and_are_branded(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $title = $this->title($html);
        $this->assertNotEmpty($title);
        $this->assertStringContainsString('Luvep', $title);
        // The old generic placeholder title must be gone.
        $this->assertNotSame('ePathways', $title);

        $this->assertMatchesRegularExpression(
            '/<meta name="description" content="[^"]+"/',
            $html,
            'Homepage should have a non-empty meta description'
        );
    }

    public function test_home_canonical_points_to_production_root(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertSame('https://luvep.com/', $this->canonical($html));
        // Exact string the sitemap suite also relies on.
        $this->get('/')->assertSee('<link rel="canonical" href="https://luvep.com/">', false);
    }

    public function test_canonical_never_uses_old_domain(): void
    {
        foreach (['/', '/about-us', '/immigration', '/programs-levels'] as $path) {
            $canonical = $this->canonical($this->get($path)->getContent());
            $this->assertStringStartsWith('https://luvep.com', $canonical);
            $this->assertStringNotContainsString('epathways.co.nz', $canonical);
        }
    }

    public function test_canonical_drops_query_strings(): void
    {
        $html = $this->get('/programs-levels?utm_source=fb&page=2')->assertOk()->getContent();

        $canonical = $this->canonical($html);
        $this->assertSame('https://luvep.com/programs-levels', $canonical);
        $this->assertStringNotContainsString('?', $canonical);
    }

    public function test_open_graph_url_uses_production_domain(): void
    {
        $html = $this->get('/immigration')->assertOk()->getContent();

        $this->assertMatchesRegularExpression(
            '/<meta property="og:url" content="https:\/\/luvep\.com\/immigration"/',
            $html
        );
        $this->assertStringContainsString('<meta property="og:site_name" content="Luvep">', $html);
        // Default share card is the dedicated 1200×630 Luvep OG image.
        $this->assertStringContainsString(
            '<meta property="og:image" content="https://luvep.com/images/og-luvep.png">',
            $html
        );
    }

    public function test_organization_json_ld_is_valid_and_on_production_domain(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $blocks = $this->jsonLdBlocks($html);
        $this->assertNotEmpty($blocks, 'Homepage should emit JSON-LD');

        $org = collect($blocks)->firstWhere('@type', 'Organization');
        $this->assertNotNull($org, 'Homepage should include Organization structured data');
        $this->assertIsArray($org, 'Organization JSON-LD must be valid JSON');
        $this->assertSame('Luvep', $org['name']);
        $this->assertSame('https://luvep.com/', $org['url']);
        $this->assertSame('support@luvep.com', $org['email']);
        // Logo is the current Luvep logo (legacy "ep-" filename), absolute on prod.
        $this->assertSame('https://luvep.com/images/ep-logo.png', $org['logo']);
        $this->assertStringNotContainsString('epathways.co.nz', json_encode($org));

        // Exactly one Organization entity on the page.
        $this->assertCount(1, collect($blocks)->where('@type', 'Organization'));
    }

    public function test_important_pages_each_have_exactly_one_h1(): void
    {
        // The public pages are client-rendered (no SSR), so the primary H1 lives
        // in the page component source rather than the server HTML. Guard that
        // each important public page declares exactly one <h1>/<motion.h1>.
        $pageFiles = [
            'home' => 'resources/js/pages/home/HomePage.jsx',
            'immigration' => 'resources/js/pages/immigration/ImmigrationPage.jsx',
            'education-journey' => 'resources/js/pages/education-journey/EducationJourneyPage.jsx',
            'programs-levels' => 'resources/js/pages/programs/ProgramsLevels.jsx',
        ];

        foreach ($pageFiles as $label => $relative) {
            $source = file_get_contents(base_path($relative));
            $count = preg_match_all('/<(?:motion\.)?h1[\s>]/', $source);
            $this->assertSame(1, $count, "Page [{$label}] must have exactly one H1, found {$count}");
        }
    }

    public function test_homepage_key_internal_links_are_reachable(): void
    {
        // The homepage links to these SEO pages via descriptive anchors. Guard
        // that none 404 (the ServicesGrid "Engagement Services" tile previously
        // pointed at a non-existent /contact route).
        foreach (['/education-journey', '/programs-levels', '/fee-guide', '/immigration', '/accommodation', '/booking'] as $path) {
            $status = $this->get($path)->getStatusCode();
            $this->assertNotSame(404, $status, "Homepage link target {$path} must not 404 (got {$status})");
        }
    }

    public function test_important_public_pages_have_unique_titles(): void
    {
        $paths = [
            '/', '/about-us', '/immigration', '/education-journey',
            '/programs-levels', '/fee-guide', '/accommodation', '/visa-approved',
            '/activities', '/resident-interest', '/work-interest',
            '/student-interest', '/visitor-interest', '/family-interest',
        ];

        $titles = [];
        foreach ($paths as $path) {
            $titles[$path] = $this->title($this->get($path)->assertOk()->getContent());
            $this->assertNotEmpty($titles[$path], "Missing <title> for {$path}");
        }

        $this->assertSame(
            count($titles),
            count(array_unique($titles)),
            'Every important public page must have a unique <title>: '.json_encode($titles)
        );
    }

    public function test_dynamic_program_has_correct_canonical_and_unique_title(): void
    {
        $program = Program::create([
            'title' => 'Diploma in Cybersecurity',
            'institution' => 'Test Institute',
            'level' => 6,
            'category' => 'diplomas',
            'slug' => 'diploma-in-cybersecurity',
            'status' => 'published',
            'description' => 'A hands-on New Zealand diploma covering network defence, incident response and secure systems.',
        ]);

        $html = $this->get('/program-details/'.$program->slug)->assertOk()->getContent();

        $this->assertSame(
            'https://luvep.com/program-details/diploma-in-cybersecurity',
            $this->canonical($html)
        );

        $title = $this->title($html);
        $this->assertStringContainsString('Diploma in Cybersecurity', $title);
        $this->assertStringContainsString('Luvep', $title);

        // Breadcrumb structured data for the programme hierarchy.
        $breadcrumb = collect($this->jsonLdBlocks($html))->firstWhere('@type', 'BreadcrumbList');
        $this->assertNotNull($breadcrumb, 'Programme page should include BreadcrumbList JSON-LD');
        $this->assertSame('https://luvep.com/', $breadcrumb['itemListElement'][0]['item']);
    }

    public function test_unpublished_program_is_not_reachable(): void
    {
        $draft = Program::create([
            'title' => 'Hidden Draft Programme',
            'institution' => 'Test Institute',
            'level' => 5,
            'category' => 'diplomas',
            'slug' => 'hidden-draft-programme',
            'status' => 'draft',
        ]);

        $this->get('/program-details/'.$draft->slug)->assertNotFound();
    }

    public function test_private_prefixes_resolve_to_noindex(): void
    {
        $seo = app(Seo::class);

        $this->assertSame('noindex,nofollow', $seo->robotsFor('admin/dashboard'));
        $this->assertSame('noindex,nofollow', $seo->robotsFor('portal/lead/dashboard'));
        $this->assertSame('noindex,nofollow', $seo->robotsFor('api/search'));

        $this->assertSame('index,follow', $seo->robotsFor('/'));
        $this->assertSame('index,follow', $seo->robotsFor('immigration'));
    }
}
