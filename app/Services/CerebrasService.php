<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CerebrasService
{
    private string $apiKey;
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.cerebras.api_key');
        $this->baseUrl = config('services.cerebras.base_url');
        $this->model = config('services.cerebras.model');
    }

    public function analyze(Lead $lead): array
    {
        $lead->loadMissing(['studyPlans', 'educationExps']);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSystemPrompt()],
                ['role' => 'user', 'content' => $this->buildUserMessage($lead)],
            ],
            'temperature' => 0.3,
        ]);

        if (!$response->successful()) {
            Log::error('Cerebras API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'lead_id' => $lead->lead_id,
            ]);
            throw new \RuntimeException('Cerebras API request failed: ' . $response->status());
        }

        $content = $response->json('choices.0.message.content');

        if (!$content) {
            throw new \RuntimeException('Cerebras API returned empty content');
        }

        $jsonString = $this->extractJson($content);

        $analysis = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Cerebras JSON parse error', [
                'error' => json_last_error_msg(),
                'content' => $content,
                'lead_id' => $lead->lead_id,
            ]);
            throw new \RuntimeException('Failed to parse Cerebras response as JSON');
        }

        if (!isset($analysis['overall_score'], $analysis['categories'])) {
            Log::error('Cerebras response missing required fields', [
                'content' => $content,
                'lead_id' => $lead->lead_id,
            ]);
            throw new \RuntimeException('Cerebras response missing required fields');
        }

        return $analysis;
    }

    private function extractJson(string $content): string
    {
        $trimmed = trim($content);

        if (preg_match('/```(?:json)?\s*(.+?)\s*```/s', $trimmed, $m)) {
            return trim($m[1]);
        }

        $start = strpos($trimmed, '{');
        $end = strrpos($trimmed, '}');

        if ($start !== false && $end !== false && $end > $start) {
            return substr($trimmed, $start, $end - $start + 1);
        }

        return $trimmed;
    }

    private function buildSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an immigration education consultant AI for ePathways, a New Zealand education consultancy. Analyze the applicant data and produce an eligibility score out of 100.

## Scoring Categories

1. **Financial Readiness (50 points max)**
   - This is the GATEKEEPER. If the applicant clearly has NO funds and NO sponsor, score 0 for this category AND set overall_score to 0.
   - Tuition thresholds per year:
     - Level 7 (Bachelor): ~26,000 NZD
     - Level 8 (PG Diploma): ~28,000 NZD
     - Level 9 (Master's): ~33,000 NZD
   - Living expenses: 20,000 NZD per year (required show money)
   - Score higher if: multiple funding sources, strong sponsor with documented income, bank statements available
   - Score lower if: budget unclear, no documentation mentioned, single weak funding source

2. **Education Qualification (25 points max)**
   - Bachelor's degree holder = eligible for Level 7, 8, or 9 → high score
   - No Bachelor's but has managerial/supervisory work experience = eligible for Level 8 or 9 only → moderate score
   - No Bachelor's + no relevant experience = limited options → low score
   - Deduct for: large unexplained education gaps, no documentation available
   - Bonus for: higher degrees, strong marks, relevant field of study to chosen course

3. **Work Experience (15 points max)**
   - Relevance of work to chosen study pathway
   - Duration and seniority (manager/supervisor roles score higher)
   - Critical for non-degree holders targeting Level 8/9
   - Score 0 if no work experience provided at all

4. **Immigration & Character Risk (10 points max)**
   - Start at 10, deduct for red flags:
     - Visa refusals: -3 each
     - Criminal convictions: -4
     - Deportation history: -5
     - Under investigation: -4
     - Health issues requiring care: -2 each
   - Positive signals: clean travel history, previous approved visas, NZ contacts, home ties (property/business ownership)

## Pathway Recommendation Rules

- If married/partnered AND has family members likely to accompany → recommend Level 9 (Master's)
- If has Bachelor's degree → can do Level 7, 8, or 9 (recommend based on funds and goals)
- If NO Bachelor's but has managerial experience → recommend Level 8 or 9
- If NO Bachelor's and NO managerial experience → recommend Level 7 only if they have equivalent qualifications

## Output Format

CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble, no commentary. The output must start with `{` and end with `}` and be parseable by JSON.parse().

The JSON object must have exactly these fields with these types:

{
  "overall_score": 75,
  "categories": {
    "financial_readiness": { "score": 35, "max": 50, "summary": "Applicant shows clear funding plan with bank statements and a sponsor (uncle) earning verified income. Total available funds cover Year 1 tuition plus 20,000 NZD living expenses." },
    "education": { "score": 22, "max": 25, "summary": "Holds Bachelor of Computer Science (2019, Distinction). Field aligns with chosen Master's pathway. No education gaps." },
    "work_experience": { "score": 12, "max": 15, "summary": "3 years as Software Engineer at established firm, last 12 months as Senior. Relevant to chosen study area. Provides strong demonstration of work-readiness." },
    "immigration_risk": { "score": 9, "max": 10, "summary": "Clean travel history, no visa refusals, owns family home in origin country (strong home tie). One previous tourist visa to Australia approved." }
  },
  "recommended_pathway": "Master's Degree (Level 9)",
  "pathway_reasoning": "Strong Bachelor's foundation, relevant work experience, and adequate funding make Level 9 viable. Master's also opens stronger post-study work pathway for partner accompaniment.",
  "strengths": ["Bachelor's in relevant field", "Documented funding from multiple sources", "Strong home ties", "Relevant work experience"],
  "concerns": ["English test scores not yet provided", "Sponsor relationship documentation may need notarization"],
  "summary": "Applicant is a well-prepared candidate with solid academic, financial, and professional foundations for a Master's pathway in New Zealand. Minor documentation items remain. Overall low-risk, recommend proceeding."
}

Use the example above as the FORMAT but produce values that reflect the actual applicant data. Replace each example value with one specific to the applicant being analyzed. Always include all keys shown above. Output JSON only.
PROMPT;
    }

    private function buildUserMessage(Lead $lead): string
    {
        $studyPlan = $lead->studyPlans->first();
        $educationExps = $lead->educationExps;

        $data = [
            'personal' => [
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name,
                'gender' => $lead->gender,
                'marital_status' => $lead->marital_status,
                'dob' => $lead->dob,
                'country_of_birth' => $lead->country_of_birth,
                'citizenship' => $lead->citizenship,
                'residence_country' => $lead->residence_country,
                'has_passport' => $lead->has_passport,
            ],
            'study_plans' => $studyPlan ? [
                'preferred_course' => $studyPlan->preferred_course,
                'qualification_level' => $studyPlan->qualification_level,
                'preferred_city' => $studyPlan->preferred_city,
                'preferred_intake' => $studyPlan->preferred_intake,
                'english_test_taken' => $studyPlan->english_test_taken,
                'english_test_type' => $studyPlan->english_test_type,
                'score_overall' => $studyPlan->score_overall,
                'score_reading' => $studyPlan->score_reading,
                'score_writing' => $studyPlan->score_writing,
                'score_listening' => $studyPlan->score_listening,
                'score_speaking' => $studyPlan->score_speaking,
            ] : null,
            'education' => [
                'notes' => $lead->education_notes,
                'qualifications' => $educationExps->map(fn($e) => [
                    'level' => $e->level,
                    'field_of_study' => $e->field_of_study,
                    'institution' => $e->institution,
                    'start_date' => $e->start_date,
                    'end_date' => $e->end_date,
                    'average_marks' => $e->average_marks,
                ])->toArray(),
                'gap_explanation' => $lead->gap_explanation,
            ],
            'work_experience' => $lead->work_info,
            'financial_info' => $lead->financial_info,
            'source_of_funds_info' => $lead->source_of_funds_info,
            'immigration_info' => $lead->immigration_info,
            'character_info' => $lead->character_info,
            'health_info' => $lead->health_info,
            'family_info' => $lead->family_info,
            'nz_contacts_info' => $lead->nz_contacts_info,
            'military_info' => $lead->military_info,
            'home_ties_info' => $lead->home_ties_info,
        ];

        return "Analyze this applicant's eligibility for studying in New Zealand:\n\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
