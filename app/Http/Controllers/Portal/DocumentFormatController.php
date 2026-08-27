<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\DocumentFormat;
use App\Models\DocumentFormatCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Staff-built document formats (Word-style rich text) and their per-case use.
 * Actions redirect back to whichever portal page invoked them, so both the
 * immigration and immigration-adviser Client Documents screens share these.
 */
class DocumentFormatController extends Controller
{
    private array $rules = [
        'name' => 'required|string|max:160',
        'content' => 'nullable|string',
        'category' => 'nullable|in:client_facing,internal',
        'status' => 'nullable|in:draft,live',
        'visa_types' => 'nullable|array',
        'visa_types.*' => 'string|max:120',
    ];

    public function store(Request $request)
    {
        $data = $request->validate($this->rules);

        DocumentFormat::create([
            'name' => $data['name'],
            'category' => $data['category'] ?? 'client_facing',
            'content' => $data['content'] ?? null,
            'visa_types' => $data['visa_types'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'created_by' => Auth::id(),
        ]);

        return back()->with('success', 'Document format created.');
    }

    public function update(Request $request, DocumentFormat $format)
    {
        $data = $request->validate($this->rules);
        $format->update([
            'name' => $data['name'],
            'category' => $data['category'] ?? $format->category,
            'content' => $data['content'] ?? null,
            'visa_types' => $data['visa_types'] ?? null,
            'status' => $data['status'] ?? $format->status,
        ]);

        return back()->with('success', 'Document format saved.');
    }

    public function destroy(DocumentFormat $format)
    {
        $format->delete();

        return back()->with('success', 'Document format deleted.');
    }

    /**
     * Apply a format to one or more cases — each gets its own (optionally
     * edited) copy of the content. Re-applying to the same case updates it.
     */
    public function apply(Request $request, DocumentFormat $format)
    {
        $data = $request->validate([
            'lead_ids' => 'required|array|min:1|max:100',
            'lead_ids.*' => 'integer|exists:leads,id',
            'content' => 'nullable|string',
        ]);

        foreach ($data['lead_ids'] as $leadId) {
            DocumentFormatCase::updateOrCreate(
                ['document_format_id' => $format->id, 'lead_id' => $leadId],
                ['content' => $data['content'] ?? $format->content, 'created_by' => Auth::id()],
            );
        }

        $n = count($data['lead_ids']);

        return back()->with('success', "“{$format->name}” applied to {$n} case".($n === 1 ? '' : 's').'.');
    }

    public function removeUse(DocumentFormatCase $use)
    {
        $use->delete();

        return back()->with('success', 'Removed from the case.');
    }
}
