<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PropertyController extends Controller
{
    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'suburb' => ['nullable', Rule::in(['Hobsonville', 'Glenfield', 'Kelston', 'Hillsborough', 'Sunnynook'])],
            'room_type' => ['required', Rule::in(['single', 'ensuite'])],
            'has_wardrobe' => 'boolean',
            'bed_type' => ['required', Rule::in(['single', 'double'])],
            'bathroom_type' => ['required', Rule::in(['shared', 'private'])],
            'includes' => 'nullable|string',
            'map_url' => 'nullable|string|max:2000',
            'rent_single' => 'required|numeric|min:0',
            'rent_couple' => 'nullable|numeric|min:0',
            'bills_excluded' => 'boolean',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['available', 'unavailable'])],
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp,gif|max:4096',
        ];
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $roomType = $request->query('room_type');
        $bedType = $request->query('bed_type');

        $properties = Property::with('images')
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%")
                ->orWhere('suburb', 'like', "%{$search}%")))
            ->when(in_array($status, ['available', 'unavailable'], true), fn ($q) => $q->where('status', $status))
            ->when(in_array($roomType, ['single', 'ensuite'], true), fn ($q) => $q->where('room_type', $roomType))
            ->when(in_array($bedType, ['single', 'double'], true), fn ($q) => $q->where('bed_type', $bedType))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return inertia('portal/accommodation/Properties', [
            'properties' => $properties,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'room_type' => $roomType,
                'bed_type' => $bedType,
            ],
        ]);
    }

    public function create()
    {
        return inertia('portal/accommodation/PropertyForm', ['property' => null]);
    }

    public function store(Request $request)
    {
        $property = Property::create($this->cleanData($request));
        $this->storeImages($property, $request->file('images', []));

        return redirect()->route('portal.accommodation.properties.index')
            ->with('success', 'Property created successfully.');
    }

    public function edit(Property $property)
    {
        $property->load('images');

        return inertia('portal/accommodation/PropertyForm', ['property' => $property]);
    }

    public function update(Request $request, Property $property)
    {
        $property->update($this->cleanData($request));
        $this->storeImages($property, $request->file('images', []));

        return redirect()->route('portal.accommodation.properties.index')
            ->with('success', 'Property updated successfully.');
    }

    public function destroy(Property $property)
    {
        $property->delete();

        return redirect()->route('portal.accommodation.properties.index')
            ->with('success', 'Property deleted successfully.');
    }

    public function destroyImage(Property $property, PropertyImage $image)
    {
        abort_unless($image->property_id === $property->id, 404);
        $image->delete(); // also removes the file via PropertyImage::booted() deleting event

        return redirect()->back()->with('success', 'Image removed.');
    }

    /** Validated scalar fields with booleans normalized. */
    private function cleanData(Request $request): array
    {
        $data = $request->validate($this->rules());
        unset($data['images']);
        $data['has_wardrobe'] = $request->boolean('has_wardrobe');
        $data['bills_excluded'] = $request->boolean('bills_excluded');

        return $data;
    }

    /** Store each uploaded file and append it as an ordered image row. */
    private function storeImages(Property $property, array $images): void
    {
        $next = (int) $property->images()->max('sort_order');

        foreach ($images as $file) {
            $property->images()->create([
                'path' => $file->store('accommodation/properties', 'public'),
                'sort_order' => ++$next,
            ]);
        }
    }
}
