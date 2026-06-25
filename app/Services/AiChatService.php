<?php

namespace App\Services;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\User;

/**
 * Orchestrates one staff chat turn: persists the user message, replays the
 * last N messages as context, calls the model, and persists the reply.
 * Conversations are per-user and survive across sessions.
 */
class AiChatService
{
    public function __construct(protected AIService $ai) {}

    /**
     * @return array{conversation: AiConversation, message: AiMessage}
     */
    public function sendMessage(User $user, ?AiConversation $conversation, string $userMessage): array
    {
        $conversation = $conversation ?? AiConversation::create([
            'user_id'         => $user->id,
            'title'           => str()->limit($userMessage, 60, ''),
            'last_message_at' => now(),
        ]);

        AiMessage::create([
            'ai_conversation_id' => $conversation->id,
            'role'               => 'user',
            'content'            => $userMessage,
        ]);

        // System prompt + the most recent turns (last 20 by default).
        $history = $conversation->latestMessages((int) config('ai.chat_history_limit', 20))
            ->map(fn (AiMessage $m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        $messages = array_merge(
            [['role' => 'system', 'content' => $this->ai->getSystemPrompt($user)]],
            $history,
        );

        $result = $this->ai->chat($messages);
        $assistantContent = $result['content']
            ?: "I'm sorry — I had trouble responding just now. Please try again in a moment.";

        $assistantMessage = AiMessage::create([
            'ai_conversation_id' => $conversation->id,
            'role'               => 'assistant',
            'content'            => $assistantContent,
            'metadata'           => ['model' => $result['model'] ?? null],
            'token_count'        => $result['tokens'] ?? null,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return [
            'conversation' => $conversation->fresh(),
            'message'      => $assistantMessage,
        ];
    }
}
