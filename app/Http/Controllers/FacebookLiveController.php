<?php

namespace App\Http\Controllers;

use App\Models\FacebookLiveSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FacebookLiveController extends Controller
{
    private function rules(): array
    {
        return [
            'title'        => 'required|string|max:255',
            'description'  => 'required|string',
            'fb_link'      => 'required|url|max:500',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'session_date' => 'required|date',
        ];
    }

    public function index()
    {
        $sessions = FacebookLiveSession::orderBy('session_date', 'desc')->get();

        return inertia('admin/FacebookLive', ['sessions' => $sessions]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('facebook-live/images', 'public');
        }

        FacebookLiveSession::create($validated);

        return redirect()->back()->with('success', 'Session created successfully.');
    }

    public function update(Request $request, $id)
    {
        $session = FacebookLiveSession::findOrFail($id);
        $validated = $request->validate($this->rules());

        if ($request->hasFile('image')) {
            if ($session->image) {
                Storage::disk('public')->delete($session->image);
            }
            $validated['image'] = $request->file('image')->store('facebook-live/images', 'public');
        } else {
            unset($validated['image']);
        }

        $session->update($validated);

        return redirect()->back()->with('success', 'Session updated successfully.');
    }

    public function destroy($id)
    {
        $session = FacebookLiveSession::findOrFail($id);

        if ($session->image) {
            Storage::disk('public')->delete($session->image);
        }

        $session->delete();

        return redirect()->back()->with('success', 'Session deleted successfully.');
    }
}
