<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Program;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HomeController extends Controller
{
    /** Landing page — feeds live events + published programs into the marketing sections. */
    public function index()
    {
        return inertia('home/HomePage', [
            'events' => $this->liveEvents(),
            'programGroups' => $this->programGroups(),
        ]);
    }

    /** Upcoming / ongoing events for the "News & Announcements" strip. */
    private function liveEvents()
    {
        try {
            return Event::whereIn('status', ['upcoming', 'ongoing'])
                ->orderBy('date_from')
                ->limit(6)
                ->get()
                ->map(fn (Event $e) => [
                    'id' => $e->id,
                    'title' => $e->name,
                    'excerpt' => $e->description,
                    'type' => $e->type,
                    'mode' => $e->mode,
                    'date' => $e->date_from ? $e->date_from->format('d F Y') : null,
                    'banner_url' => $e->banner_image ? Storage::disk('public')->url($e->banner_image) : null,
                    'link' => $e->event_code ? url('/register/'.$e->event_code) : ($e->registration_link ?: '/activities'),
                ]);
        } catch (\Throwable $e) {
            Log::error('Home: live events failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /** Published programs grouped by category for the "In-Demand Programs" carousel. */
    private function programGroups()
    {
        try {
            return Program::where('status', 'published')
                ->orderBy('level')->latest()->get()
                ->groupBy(fn (Program $p) => $p->category ?: 'Programs')
                ->map(function ($items, $category) {
                    $intakes = $items->pluck('intake_months')->filter()
                        ->flatMap(function ($v) {
                            if (is_array($v)) {
                                return $v;
                            }
                            $decoded = json_decode((string) $v, true);

                            return is_array($decoded) ? $decoded : explode(',', (string) $v);
                        })
                        ->map(fn ($v) => trim((string) $v))->filter()->unique()->take(8)->values();

                    $cover = $items->first(fn (Program $p) => ! empty($p->image));

                    return [
                        'category' => $category,
                        'levels' => $items->pluck('level')->filter()->unique()->take(2)->values(),
                        'programs' => $items->map(fn (Program $p) => ['title' => $p->title, 'slug' => $p->slug])->take(6)->values(),
                        'intakes' => $intakes,
                        'banner_url' => $cover ? Storage::disk('public')->url($cover->image) : null,
                        'count' => $items->count(),
                    ];
                })->values()->take(8);
        } catch (\Throwable $e) {
            Log::error('Home: program groups failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }
}
