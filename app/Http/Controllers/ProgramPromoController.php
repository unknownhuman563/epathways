<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgramPromo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProgramPromoController extends Controller
{
    private function rules(?int $id = null): array
    {
        return [
            'program_id'   => 'required|integer|exists:programs,id',
            'title'        => 'required|string|max:160',
            'description'  => 'nullable|string|max:2000',
            'percent'      => 'required|numeric|min:0|max:100',
            'date_from'    => 'required|date',
            'date_end'     => 'required|date|after_or_equal:date_from',
            'is_active'    => 'sometimes|boolean',
            'promo_code'   => 'nullable|string|max:60',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'cta_label'    => 'nullable|string|max:80',
            'cta_link'     => 'nullable|url|max:500',
        ];
    }

    public function index()
    {
        $promos = ProgramPromo::with(['program:id,title,slug,level,category'])
            ->latest()->get()
            ->map(function (ProgramPromo $p) {
                $arr = $p->toArray();
                $arr['banner_url'] = $p->banner_url;
                return $arr;
            });

        $programs = Program::orderBy('title')
            ->get(['id', 'title', 'slug', 'level', 'category']);

        return inertia('admin/Promos', [
            'promos'   => $promos,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $data['is_active'] = (bool) ($data['is_active'] ?? true);
        $data['created_by'] = $request->user()?->id;

        if ($request->hasFile('banner_image')) {
            $data['banner_image'] = $request->file('banner_image')->store('promos/banners', 'public');
        } else {
            unset($data['banner_image']);
        }

        ProgramPromo::create($data);

        return redirect()->back()->with('success', 'Promo created successfully.');
    }

    public function update(Request $request, $id)
    {
        $promo = ProgramPromo::findOrFail($id);
        $data = $request->validate($this->rules($promo->id));
        $data['is_active'] = (bool) ($data['is_active'] ?? false);

        if ($request->hasFile('banner_image')) {
            if ($promo->banner_image) {
                Storage::disk('public')->delete($promo->banner_image);
            }
            $data['banner_image'] = $request->file('banner_image')->store('promos/banners', 'public');
        } else {
            unset($data['banner_image']);
        }

        $promo->update($data);

        return redirect()->back()->with('success', 'Promo updated successfully.');
    }

    public function destroy($id)
    {
        $promo = ProgramPromo::findOrFail($id);

        if ($promo->banner_image) {
            Storage::disk('public')->delete($promo->banner_image);
        }

        $promo->delete();

        return redirect()->back()->with('success', 'Promo deleted successfully.');
    }
}
