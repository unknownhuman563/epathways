<?php

namespace Tests\Feature;

use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Force a known canonical base so assertions are host-independent.
        config(['app.canonical_url' => 'https://luvep.com']);
    }

    public function test_sitemap_returns_ok_and_xml_content_type(): void
    {
        $res = $this->get('/sitemap.xml');

        $res->assertOk();
        $this->assertStringContainsString('application/xml', $res->headers->get('Content-Type'));
    }

    public function test_sitemap_is_valid_xml_with_urlset_root(): void
    {
        $body = $this->get('/sitemap.xml')->getContent();

        $this->assertStringStartsWith('<?xml', ltrim($body));
        $xml = simplexml_load_string($body);
        $this->assertNotFalse($xml, 'Sitemap should be well-formed XML');
        $this->assertSame('urlset', $xml->getName());
    }

    public function test_sitemap_uses_production_domain_only(): void
    {
        $body = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('https://luvep.com/', $body);
        $this->assertStringContainsString('https://luvep.com/immigration', $body);
        $this->assertStringContainsString('https://luvep.com/education-journey', $body);
    }

    public function test_sitemap_excludes_old_and_staging_domains(): void
    {
        $body = $this->get('/sitemap.xml')->getContent();

        $this->assertStringNotContainsString('epathways.co.nz', $body);
        $this->assertStringNotContainsString('staging.', $body);
        $this->assertStringNotContainsString('localhost', $body);
    }

    public function test_sitemap_excludes_private_and_auth_routes(): void
    {
        $body = $this->get('/sitemap.xml')->getContent();

        foreach (['/admin', '/portal/', '/lead-portal', '/track', '/login', '/api/', '/dtr'] as $private) {
            $this->assertStringNotContainsString('luvep.com'.$private, $body);
        }
    }

    public function test_sitemap_excludes_transactional_conversion_pages(): void
    {
        $body = $this->get('/sitemap.xml')->getContent();

        // Publicly accessible but deliberately kept out of the sitemap.
        $this->assertStringNotContainsString('luvep.com/booking', $body);
        $this->assertStringNotContainsString('luvep.com/free-assessment', $body);
    }

    public function test_sitemap_includes_published_programs_only(): void
    {
        $published = Program::create([
            'title' => 'Diploma in Business',
            'institution' => 'Test Institute',
            'level' => 5,
            'category' => 'diplomas',
            'slug' => 'diploma-in-business',
            'status' => 'published',
        ]);

        Program::create([
            'title' => 'Draft Programme',
            'institution' => 'Test Institute',
            'level' => 5,
            'category' => 'diplomas',
            'slug' => 'draft-programme',
            'status' => 'draft',
        ]);

        $body = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString('https://luvep.com/program-details/'.$published->slug, $body);
        $this->assertStringNotContainsString('/program-details/draft-programme', $body);
    }

    public function test_robots_txt_references_sitemap_and_allows_crawl(): void
    {
        // robots.txt is a static file served by the web server, not the router,
        // so assert its contents on disk rather than via an HTTP request.
        $body = file_get_contents(public_path('robots.txt'));

        $this->assertStringContainsString('Sitemap: https://luvep.com/sitemap.xml', $body);
        $this->assertStringContainsString('Allow: /', $body);
        $this->assertStringContainsString('Disallow: /admin/', $body);
        $this->assertStringContainsString('Disallow: /portal/', $body);
    }

    public function test_home_page_has_canonical_pointing_to_production(): void
    {
        $res = $this->get('/');

        $res->assertOk();
        $res->assertSee('<link rel="canonical" href="https://luvep.com/">', false);
    }

    public function test_unknown_route_returns_404_status(): void
    {
        $this->get('/this-route-does-not-exist-'.uniqid())->assertNotFound();
    }
}
