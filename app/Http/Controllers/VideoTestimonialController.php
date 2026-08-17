<?php

namespace App\Http\Controllers;

use App\Models\VideoTestimonial;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin management of the landing-page video testimonials (Facebook links).
 */
class VideoTestimonialController extends Controller
{
    private function guard(): void
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);
    }

    public function index()
    {
        $this->guard();

        return inertia('admin/VideoTestimonials', [
            'items' => VideoTestimonial::ordered()->get()->map(fn (VideoTestimonial $t) => [
                'id' => $t->id,
                'url' => $t->url,
                'orientation' => $t->orientation,
                'caption' => $t->caption,
                'is_published' => $t->is_published,
                'sort_order' => $t->sort_order,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $this->guard();

        $data = $this->validated($request);
        $data['sort_order'] = $data['sort_order'] ?? ((int) VideoTestimonial::max('sort_order') + 1);

        VideoTestimonial::create($data);

        return back()->with('success', 'Testimonial added.');
    }

    public function update(Request $request, VideoTestimonial $testimonial)
    {
        $this->guard();

        $testimonial->update($this->validated($request));

        return back()->with('success', 'Testimonial updated.');
    }

    public function destroy(VideoTestimonial $testimonial)
    {
        $this->guard();

        $testimonial->delete();

        return back()->with('success', 'Testimonial removed.');
    }

    /**
     * Accept either a plain Facebook URL or a full embed <iframe> / plugin URL —
     * pull the canonical video URL out of the `href=` param when present. The
     * embedded href is what actually renders, so this saves the reliable link.
     */
    private function normalizeFbUrl(string $input): string
    {
        $input = trim($input);
        if (preg_match('/[?&]href=([^&"\'\s]+)/i', $input, $m)) {
            return urldecode($m[1]);
        }

        return $input;
    }

    private function validated(Request $request): array
    {
        $request->merge(['url' => $this->normalizeFbUrl((string) $request->input('url'))]);

        return $request->validate([
            'url' => ['required', 'string', 'url', 'max:500'],
            'orientation' => ['required', Rule::in(VideoTestimonial::ORIENTATIONS)],
            'caption' => ['nullable', 'string', 'max:200'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);
    }
}
