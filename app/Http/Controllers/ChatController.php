<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Handle the incoming chat request.
     */
    public function __invoke(Request $request)
    {
        Log::info('ChatBot: Request received', ['message' => $request->message]);

        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $apiKey = config('services.gemini.api_key');

        if (!$apiKey) {
            Log::error('ChatBot: Gemini API key is missing in config.');
            return response()->json([
                'error' => 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.',
            ], 500);
        }

        $systemPrompt = "You are the ePathways Assistant, a professional and friendly consultant for ePathways, a leading New Zealand immigration and education agency. 
        Your goal is to help users with information about:
        1. New Zealand Student Visas and Post-Study Work Visas.
        2. Study programs and levels in New Zealand.
        3. Immigration processes and Licensed Immigration Consultant services.
        4. Booking consultations (via ePathways website).
        5. Free Assessments.
        
        Keep your tone professional, encouraging, and clear. If you don't know something specific about a visa rule, suggest booking a consultation with one of our licensed consultants.
        Do not make up legal advice. 
        Focus on paving the path towards a New Zealand future.";

        $geminiMessages = [];

        // Add history if provided
        if ($request->history) {
            foreach ($request->history as $msg) {
                if ($msg['role'] === 'system') continue;
                
                $role = $msg['role'] === 'assistant' ? 'model' : 'user';

                $geminiMessages[] = [
                    'role' => $role,
                    'parts' => [['text' => $msg['content']]],
                ];
            }
        }

        $geminiMessages[] = [
            'role' => 'user', 
            'parts' => [['text' => $request->message]]
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'system_instruction' => [
                    'parts' => [
                        ['text' => $systemPrompt]
                    ]
                ],
                'contents' => $geminiMessages,
                'generationConfig' => [
                    'maxOutputTokens' => 500,
                ],
            ]);

            if ($response->failed()) {
                throw new \Exception('Gemini API Error: ' . $response->body());
            }

            $responseData = $response->json();
            $reply = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not process your request at this moment.';

            return response()->json([
                'message' => $reply,
            ]);
        } catch (\Exception $e) {
            Log::error('ChatBot Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to connect to Gemini: ' . $e->getMessage(),
            ], 500);
        }
    }
}
