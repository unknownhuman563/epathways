<?php

namespace App\Support;

use App\Models\Program;
use Illuminate\Support\Str;

/**
 * Resolves per-page SEO metadata (title, description, canonical, Open Graph,
 * Twitter and JSON-LD structured data) from config/seo.php.
 *
 * Rendered server-side in resources/views/app.blade.php. Static pages resolve
 * from the config 'pages' map by path; dynamic programme pages resolve from the
 * model via forProgram(). All canonical / OG URLs are built from the fixed
 * canonical base so the request host is never leaked into metadata.
 */
class Seo
{
    /** Canonical base, e.g. "https://luvep.com" (no trailing slash). */
    public function base(): string
    {
        return rtrim((string) config('app.canonical_url', 'https://luvep.com'), '/');
    }

    /**
     * Absolute canonical URL for a request path, with any query string dropped
     * to avoid duplicate-URL signals. "/" maps to the bare base + "/".
     */
    public function canonicalFor(string $path): string
    {
        $p = trim($path, '/');

        return $this->base().($p === '' ? '/' : '/'.$p);
    }

    /** Turn a relative asset path into an absolute URL on the canonical host. */
    public function absoluteUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return $this->base().'/'.ltrim($path, '/');
    }

    /** index,follow for public pages; noindex,nofollow for private prefixes. */
    public function robotsFor(string $path): string
    {
        $p = trim($path, '/');

        foreach ((array) config('seo.noindex_prefixes', []) as $prefix) {
            if ($p === $prefix || Str::startsWith($p, $prefix.'/')) {
                return 'noindex,nofollow';
            }
        }

        return 'index,follow';
    }

    /**
     * Full SEO payload for a static/config-driven page path (as returned by
     * request()->path(): "/" for home, "about-us", "program-details/x", ...).
     */
    public function forPath(string $path): array
    {
        $key = $path === '/' ? '/' : '/'.trim($path, '/');
        $pages = (array) config('seo.pages', []);
        $meta = $pages[$key] ?? [];

        $title = $meta['title'] ?? config('seo.default_title');
        $description = $meta['description'] ?? config('seo.default_description');
        $image = $this->absoluteUrl($meta['og_image'] ?? config('seo.og_image'));
        $canonical = $this->canonicalFor($path);

        $jsonld = [];
        // Organization entity lives on the homepage; breadcrumbs on inner pages.
        if ($key === '/') {
            $jsonld[] = $this->organizationSchema();
        } elseif (! empty($meta['breadcrumb'])) {
            $jsonld[] = $this->breadcrumbSchema([
                ['name' => 'Home', 'url' => $this->canonicalFor('/')],
                ['name' => $meta['breadcrumb'], 'url' => $canonical],
            ]);
        }

        return $this->assemble([
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'robots' => $this->robotsFor($path),
            'og_title' => $meta['og_title'] ?? $title,
            'og_description' => $meta['og_description'] ?? $description,
            'og_url' => $canonical,
            'og_type' => 'website',
            'image' => $image,
        ], $jsonld);
    }

    /**
     * Full SEO payload for a published programme detail page. Description is
     * derived from the programme's own text (HTML stripped, trimmed) so every
     * programme gets unique metadata; falls back to a composed line when empty.
     */
    public function forProgram(Program $program): array
    {
        $brand = config('seo.brand');
        $levelLabel = $program->level ? 'Level '.$program->level : null;
        $institution = $program->institution ?: optional($program->school)->name;

        $titleParts = array_filter([$program->title, $levelLabel, $institution]);
        $title = implode(' — ', $titleParts).' | '.$brand;

        $description = $this->plainSummary($program->description);
        if ($description === '') {
            $description = trim(implode(' ', array_filter([
                $program->title,
                $levelLabel ? '('.$levelLabel.')' : null,
                $institution ? 'at '.$institution : null,
                '— study programme in New Zealand offered through '.$brand.'.',
            ])));
        }

        $canonical = $this->canonicalFor('program-details/'.$program->slug);
        // image_url is appended by the controller (appendImageUrl); fall back to
        // the site default share image rather than emitting a broken URL.
        $image = $this->absoluteUrl($program->image_url ?? config('seo.og_image'));

        $breadcrumb = $this->breadcrumbSchema([
            ['name' => 'Home', 'url' => $this->canonicalFor('/')],
            ['name' => 'Programs & Levels', 'url' => $this->canonicalFor('programs-levels')],
            ['name' => $program->title, 'url' => $canonical],
        ]);

        return $this->assemble([
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'robots' => 'index,follow',
            'og_title' => $title,
            'og_description' => $description,
            'og_url' => $canonical,
            'og_type' => 'article',
            'image' => $image,
        ], [$breadcrumb]);
    }

    /** Compose the final structured array the blade template renders. */
    private function assemble(array $meta, array $jsonld): array
    {
        return [
            'title' => $meta['title'],
            'description' => $meta['description'],
            'canonical' => $meta['canonical'],
            'robots' => $meta['robots'],
            'og' => [
                'type' => $meta['og_type'],
                'site_name' => config('seo.brand'),
                'title' => $meta['og_title'],
                'description' => $meta['og_description'],
                'url' => $meta['og_url'],
                'image' => $meta['image'],
            ],
            'twitter' => [
                'card' => config('seo.twitter_card', 'summary_large_image'),
                'title' => $meta['og_title'],
                'description' => $meta['og_description'],
                'image' => $meta['image'],
            ],
            'jsonld' => array_values(array_filter($jsonld)),
        ];
    }

    /** schema.org/Organization built from factual config values only. */
    public function organizationSchema(): array
    {
        $org = (array) config('seo.organization', []);

        $sameAs = $org['same_as'] ?: array_values(array_filter([
            config('services.contact.facebook'),
        ]));

        $schema = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => config('seo.brand'),
            'url' => $this->canonicalFor('/'),
            'logo' => $this->absoluteUrl(config('seo.logo', config('seo.og_image'))),
            'description' => $org['description'] ?? config('seo.default_description'),
            'telephone' => $org['telephone'] ?? config('services.contact.phone'),
            'email' => $org['email'] ?? null,
            'areaServed' => $org['area_served'] ?? null,
            'sameAs' => $sameAs ?: null,
        ], fn ($v) => $v !== null && $v !== '' && $v !== []);

        return $schema;
    }

    /** schema.org/BreadcrumbList from an ordered [name,url] list. */
    private function breadcrumbSchema(array $items): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($item, $i) => [
                '@type' => 'ListItem',
                'position' => $i + 1,
                'name' => $item['name'],
                'item' => $item['url'],
            ], $items, array_keys($items)),
        ];
    }

    /** Strip HTML, collapse whitespace and clamp to a meta-description length. */
    private function plainSummary(?string $html, int $limit = 160): string
    {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags((string) $html)));

        return $text === '' ? '' : Str::limit($text, $limit);
    }
}
