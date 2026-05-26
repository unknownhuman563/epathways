<?php

namespace App\Services;

use App\Models\ProgramPromo;
use Illuminate\Support\Facades\Log;

/**
 * Centralised query for the public "active promos" surface. Used by
 * HomeController, ProgramController, and the education-journey closure so
 * they all return identically-shaped payloads.
 */
class PromoFeed
{
    /**
     * Active promos ordered by biggest discount first, then by which expires
     * soonest (urgency). Bounded so a runaway dataset can't tank the home
     * page. Wrapped in try/catch so a missing table (e.g. before migrate)
     * degrades gracefully instead of 500-ing the public site.
     */
    public static function active(int $limit = 6): array
    {
        try {
            return ProgramPromo::active()
                ->with('program:id,title,slug,level,image')
                ->orderByDesc('percent')
                ->orderBy('date_end')
                ->limit($limit)
                ->get()
                ->map(fn (ProgramPromo $p) => $p->toPublicArray())
                ->all();
        } catch (\Throwable $e) {
            Log::warning('PromoFeed::active failed', ['error' => $e->getMessage()]);

            return [];
        }
    }
}
