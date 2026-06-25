<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Services\AIService;
use App\Services\AiChatService;
use Illuminate\Http\Request;

/**
 * JSON endpoints behind the topbar AI chat panel. Session-authenticated
 * (lives in the web auth group), so the frontend sends the X-XSRF-TOKEN
 * header on writes. Every read/write is scoped to the current user's own
 * conversations. Leads (external clients) are blocked — staff only.
 */
class AiChatController extends Controller
{
    public function __construct(
        protected AiChatService $chatService,
        protected AIService $ai,
    ) {}

    /** GET /api/ai/conversations — the user's recent, non-archived threads. */
    public function index(Request $request)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['conversations' => [], 'ai_disabled' => true]);
        }

        $conversations = AiConversation::query()
            ->where('user_id', $request->user()->id)
            ->where('is_archived', false)
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get(['id', 'title', 'last_message_at']);

        return response()->json(['conversations' => $conversations]);
    }

    /** GET /api/ai/conversations/{conversation} — full message history. */
    public function show(Request $request, AiConversation $conversation)
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);

        return response()->json([
            'conversation' => $conversation,
            'messages'     => $conversation->messages, // ordered asc by the relation
        ]);
    }

    /** POST /api/ai/messages — send a turn; conversation_id optional (new thread if absent). */
    public function sendMessage(Request $request)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['error' => 'AI is currently disabled.'], 403);
        }

        abort_if($request->user()->isLead(), 403, 'AI chat is for staff only.');

        $data = $request->validate([
            'message'         => 'required|string|max:8000',
            'conversation_id' => 'nullable|integer|exists:ai_conversations,id',
        ]);

        $conversation = null;
        if (! empty($data['conversation_id'])) {
            $conversation = AiConversation::findOrFail($data['conversation_id']);
            abort_unless($conversation->user_id === $request->user()->id, 403);
        }

        $result = $this->chatService->sendMessage($request->user(), $conversation, $data['message']);

        return response()->json([
            'conversation' => $result['conversation'],
            'message'      => $result['message'],
        ]);
    }

    /** DELETE /api/ai/conversations/{conversation} — archive (soft hide). */
    public function destroy(Request $request, AiConversation $conversation)
    {
        abort_unless($conversation->user_id === $request->user()->id, 403);

        $conversation->update(['is_archived' => true]);

        return response()->json(['success' => true]);
    }
}
