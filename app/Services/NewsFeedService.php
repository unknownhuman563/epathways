<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cache-only NZ migration news. Fetches Google News RSS, parses it, caches
 * the parsed array under one key. Page renders read from cache; the cache
 * refreshes hourly via a `Schedule::call` in routes/console.php AND lazily
 * on render if it's empty/stale.
 *
 * No DB table, no model, no migration — just an HTTP fetch + a cache key.
 */
class NewsFeedService
{
    private const CACHE_KEY = 'news_items.feed';
    private const CACHE_TTL_MINUTES = 60;

    private string $feedUrl = 'https://news.google.com/rss/search?q=new+zealand+immigration&hl=en-NZ&gl=NZ&ceid=NZ:en';

    /**
     * Latest N items for the public immigration page. Reads from cache;
     * fetches lazily if the cache is empty/expired. Catches all errors so
     * a broken feed never crashes the page render.
     *
     * @return array<int, array{title:string,link:string,source:?string,excerpt:?string,tag:string,published_at:?string}>
     */
    public static function latest(int $limit = 3): array
    {
        $items = Cache::remember(self::CACHE_KEY, now()->addMinutes(self::CACHE_TTL_MINUTES), function () {
            try {
                return (new self())->fetchAndParse();
            } catch (\Throwable $e) {
                Log::warning('NewsFeedService fetch failed', ['error' => $e->getMessage()]);
                return [];
            }
        });

        return array_slice($items, 0, $limit);
    }

    /**
     * Force a refresh — used by the hourly scheduler so visitors never
     * trigger the network fetch on the critical path.
     */
    public function refresh(): array
    {
        try {
            $items = $this->fetchAndParse();
            Cache::put(self::CACHE_KEY, $items, now()->addMinutes(self::CACHE_TTL_MINUTES));
            return $items;
        } catch (\Throwable $e) {
            Log::warning('NewsFeedService refresh failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    // ── Internals ───────────────────────────────────────────────────────────

    /**
     * HTTP GET the RSS, parse, normalize. Returns an empty array if the
     * response is bad XML; throws on network errors so the caller can log.
     *
     * @return array<int, array{title:string,link:string,source:?string,excerpt:?string,tag:string,published_at:?string}>
     */
    private function fetchAndParse(): array
    {
        $response = Http::timeout(10)
            ->withUserAgent('ePathwaysNewsBot/1.0 (+https://epathways.co.nz)')
            ->get($this->feedUrl);

        if (! $response->successful()) {
            throw new \RuntimeException("HTTP {$response->status()} fetching news feed");
        }

        $xml = @simplexml_load_string($response->body());
        if ($xml === false) {
            return [];
        }

        $nodes = $xml->channel->item ?? [];
        $items = [];

        foreach ($nodes as $node) {
            [$title, $source] = $this->splitTitle((string) $node->title);
            $link = (string) $node->link;
            if (! $title || ! $link) {
                continue;
            }

            $excerpt = $this->stripHtml((string) ($node->description ?? ''));

            $items[] = [
                'title'        => $title,
                'link'         => $link,
                'source'       => $source,
                'excerpt'      => $excerpt ?: null,
                'tag'          => $this->inferTag($title, $excerpt),
                'published_at' => $this->parseDate((string) ($node->pubDate ?? '')),
            ];
        }

        // Newest first, just in case the feed isn't already sorted.
        usort($items, fn ($a, $b) => strcmp($b['published_at'] ?? '', $a['published_at'] ?? ''));

        return $items;
    }

    /**
     * Google News titles are "Headline - Publisher". Split on the LAST " - "
     * so headlines that themselves contain dashes survive intact.
     */
    private function splitTitle(string $raw): array
    {
        $raw = trim($this->stripHtml($raw));
        $pos = strrpos($raw, ' - ');
        if ($pos === false) {
            return [$raw, null];
        }
        return [
            trim(substr($raw, 0, $pos)),
            trim(substr($raw, $pos + 3)) ?: null,
        ];
    }

    private function stripHtml(string $raw): string
    {
        $clean = html_entity_decode(strip_tags($raw), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim(preg_replace('/\s+/u', ' ', $clean));
    }

    private function parseDate(string $raw): ?string
    {
        if (! $raw) return null;
        try {
            return Carbon::parse($raw)->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Lightweight keyword → category tag so cards get a quiet pill without
     * any human input.
     */
    private function inferTag(string $title, string $excerpt): string
    {
        $hay = strtolower($title . ' ' . $excerpt);
        $rules = [
            'Policy'      => ['policy', 'minister', 'government', 'parliament', 'cabinet', 'beehive'],
            'Visa update' => ['visa', 'aewv', 'work visa', 'student visa', 'visitor'],
            'Residence'   => ['residence', 'resident', 'permanent', 'green list', 'skilled migrant'],
            'Processing'  => ['processing', 'wait time', 'backlog', 'queue'],
            'Refugee'     => ['refugee', 'asylum'],
            'Border'      => ['border', 'airport', 'arrival', 'departure'],
        ];
        foreach ($rules as $tag => $words) {
            foreach ($words as $w) {
                if (str_contains($hay, $w)) return $tag;
            }
        }
        return 'News';
    }
}
