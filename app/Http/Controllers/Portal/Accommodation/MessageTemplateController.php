<?php

namespace App\Http\Controllers\Portal\Accommodation;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function index()
    {
        $templates = MessageTemplate::orderBy('created_at')
            ->get(['id', 'title', 'content', 'notes']);

        return inertia('portal/accommodation/MessageTemplates', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        MessageTemplate::create($this->validated($request));

        return redirect()->back()->with('success', 'Template added.');
    }

    public function update(Request $request, MessageTemplate $template)
    {
        $template->update($this->validated($request));

        return redirect()->back()->with('success', 'Template updated.');
    }

    public function destroy(MessageTemplate $template)
    {
        $template->delete();

        return redirect()->back()->with('success', 'Template removed.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:20000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
