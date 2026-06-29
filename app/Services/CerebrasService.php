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
        $this->apiKey = (string) config('services.cerebras.api_key');
        $this->baseUrl = (string) config('services.cerebras.base_url', 'https://api.cerebras.ai/v1');
        $this->model = (string) config('services.cerebras.model', 'gpt-oss-120b');
    }

    /** Whether a Cerebras key is configured (else callers fall back to stubs). */
    public function configured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Generate social-post variants in the {headline, body, cta, hashtags}
     * shape the Social MVP review queue expects (distinct from generateAdCopy,
     * which produces {post, hashtags} or email subjects).
     *
     * @return list<array{headline: string, body: string, cta: string, hashtags: array}>
     */
    public function generateSocialVariants(array $brief): array
    {
        $count = max(1, min(5, (int) ($brief['variant_count'] ?? 3)));

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSocialVariantPrompt($brief, $count)],
                ['role' => 'user', 'content' => 'Write the variants for this brief:'."\n\n".json_encode([
                    'campaign_name' => $brief['campaign_name'] ?? null,
                    'service' => $brief['service'] ?? 'education',
                    'platform' => $brief['platform'] ?? 'facebook',
                    'hook_angle' => $brief['hook_angle'] ?? null,
                    'target_audience' => $brief['target_audience'] ?? null,
                    'tone' => $brief['tone'] ?? 'friendly',
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)],
            ],
            'temperature' => 0.85,
        ]);

        if (! $response->successful()) {
            Log::error('Cerebras social-variant API error', ['status' => $response->status()]);
            throw new \RuntimeException('Cerebras request failed: '.$response->status());
        }

        $content = $response->json('choices.0.message.content');
        $parsed = json_decode($this->extractJson((string) $content), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! isset($parsed['variants']) || ! is_array($parsed['variants'])) {
            Log::error('Cerebras social-variant parse error', ['content' => $content]);
            throw new \RuntimeException('Failed to parse social variants');
        }

        return array_map(fn ($v) => [
            'headline' => (string) ($v['headline'] ?? ''),
            'body' => (string) ($v['body'] ?? ''),
            'cta' => (string) ($v['cta'] ?? ''),
            'hashtags' => array_values(array_filter((array) ($v['hashtags'] ?? []))),
        ], $parsed['variants']);
    }

    /**
     * Suggest paid-ad audience targeting for a boosted post: an age range, ISO
     * country codes and interest keyword names (resolved to Zernio interest ids
     * by the caller), plus a one-line rationale. Grounded in the ePathways
     * audience — students/migrants bound for New Zealand.
     */
    public function suggestAdTargeting(array $brief): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildTargetingPrompt()],
                ['role' => 'user', 'content' => 'Suggest the audience for this ad:'."\n\n".json_encode([
                    'goal' => $brief['goal'] ?? 'traffic',
                    'platform' => $brief['platform'] ?? 'facebook',
                    'post_content' => mb_substr((string) ($brief['content'] ?? ''), 0, 1200),
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)],
            ],
            'temperature' => 0.5,
        ]);

        if (! $response->successful()) {
            Log::error('Cerebras targeting API error', ['status' => $response->status()]);
            throw new \RuntimeException('Cerebras request failed: '.$response->status());
        }

        $content = $response->json('choices.0.message.content');
        $parsed = json_decode($this->extractJson((string) $content), true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($parsed)) {
            Log::error('Cerebras targeting parse error', ['content' => $content]);
            throw new \RuntimeException('Failed to parse targeting suggestion');
        }

        $ageMin = (int) ($parsed['age_min'] ?? 18);
        $ageMax = (int) ($parsed['age_max'] ?? 45);

        return [
            'ageMin' => max(13, min(65, $ageMin)),
            'ageMax' => max(13, min(65, max($ageMin, $ageMax))),
            'countries' => array_values(array_filter(array_map(
                fn ($c) => strtoupper(substr((string) $c, 0, 2)),
                (array) ($parsed['countries'] ?? [])
            ))),
            'interests' => array_values(array_filter(array_map(
                fn ($i) => trim((string) $i),
                (array) ($parsed['interests'] ?? [])
            ))),
            'rationale' => (string) ($parsed['rationale'] ?? ''),
        ];
    }

    private function buildTargetingPrompt(): string
    {
        return <<<'PROMPT'
        You are a paid-social media buyer for ePathways, a New Zealand education & immigration consultancy. Given an ad's goal, platform and post content, propose the best paid-ad AUDIENCE.

        Context: ePathways helps international students and migrants move to New Zealand to study and settle. Typical prospects are 18-40, in source markets like India, the Philippines, Nepal, Sri Lanka, Vietnam, Pakistan and Bangladesh, plus onshore audiences already in New Zealand. Interests skew to study abroad, overseas education, student visas, IELTS/PTE, immigration, working in New Zealand, and fields like nursing, IT, business and trades.

        ## Output Format
        CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.

        Shape:
        {
          "age_min": 18,
          "age_max": 40,
          "countries": ["IN", "PH", "NP"],
          "interests": ["Study abroad", "Student visa", "New Zealand", "IELTS"],
          "rationale": "One short sentence on who and why."
        }

        Rules:
        - countries: 2-6 ISO 3166-1 alpha-2 codes most likely to convert for this post.
        - interests: 4-8 short, real interest names a platform's targeting tool would recognise (no # or hashtags).
        - Keep ages within 13-65 and age_min <= age_max.
        PROMPT;
    }

    private function buildSocialVariantPrompt(array $brief, int $count): string
    {
        $platform = $brief['platform'] ?? 'facebook';

        return <<<PROMPT
        You are a senior social-media copywriter for ePathways, a New Zealand education & immigration consultancy. Write platform-ready {$platform} post variants for a paid/organic campaign.

        Voice: warm, credible, specific. Real value props (free assessment, licensed immigration advisers, NZQA-recognised programmes, end-to-end support). No fake urgency. Tasteful emojis okay (1-4). Match the requested tone exactly.

        ## Output Format
        CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.

        Produce exactly {$count} variants. Each variant has:
        - "headline": string (a short scroll-stopping hook, max ~80 characters)
        - "body": string (the post copy, 60-180 words depending on platform; LinkedIn longer, Instagram/Facebook shorter)
        - "cta": string (a short call to action, e.g. "Take the free assessment")
        - "hashtags": array of 6-12 lowercase hashtag strings WITHOUT the # symbol

        Shape:
        {
          "variants": [
            { "headline": "...", "body": "...", "cta": "...", "hashtags": ["...", "..."] }
          ]
        }
        PROMPT;
    }

    public function generateAdCopy(array $brief): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildAdSystemPrompt($brief)],
                ['role' => 'user', 'content' => $this->buildAdUserMessage($brief)],
            ],
            'temperature' => 0.8,
        ]);

        if (! $response->successful()) {
            Log::error('Cerebras ad-copy API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Cerebras API request failed: '.$response->status());
        }

        $content = $response->json('choices.0.message.content');

        if (! $content) {
            throw new \RuntimeException('Cerebras API returned empty content');
        }

        $jsonString = $this->extractJson($content);
        $parsed = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! isset($parsed['variants']) || ! is_array($parsed['variants'])) {
            Log::error('Cerebras ad-copy parse error', [
                'error' => json_last_error_msg(),
                'content' => $content,
            ]);
            throw new \RuntimeException('Failed to parse ad-copy response');
        }

        return $parsed;
    }

    private function buildAdSystemPrompt(array $brief): string
    {
        $type = $brief['ad_type'] ?? 'social';
        $variantCount = max(1, min(5, (int) ($brief['variant_count'] ?? 3)));

        if ($type === 'email') {
            return <<<PROMPT
You are a senior marketing copywriter for ePathways, a New Zealand education and immigration consultancy. Your job is to produce conversion-focused EMAIL CAMPAIGN copy for the marketing team.

## Voice
- Warm, supportive, expert. ePathways is the trusted guide for people moving to New Zealand to study or settle.
- Concrete and specific. Reference real benefits (free assessment, NZQA-recognised programmes, licensed immigration advisers, end-to-end support).
- No clickbait, no fake urgency, no excessive emojis (one or two tasteful ones in subject lines is fine).

## Output Format
CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.

Produce exactly {$variantCount} variants. Each variant has:
- "subject": string (40-65 chars ideal, must be compelling and specific)
- "preheader": string (60-90 chars — the preview text after the subject in the inbox)
- "body": string (the full email body in plain text, 120-220 words, with short paragraphs, one clear CTA line near the end, sign off "— The ePathways team")

Shape:
{
  "variants": [
    { "subject": "...", "preheader": "...", "body": "..." }
  ]
}
PROMPT;
        }

        return <<<PROMPT
You are a senior social-media copywriter for ePathways, a New Zealand education and immigration consultancy. Produce high-engagement SOCIAL POST copy for Facebook / Instagram / LinkedIn.

## Voice
- Warm, supportive, expert. ePathways guides people moving to New Zealand to study or settle.
- Specific over generic. Mention real value props (free assessment, licensed immigration advisers, NZQA-recognised programmes, end-to-end support).
- No fake urgency. Tasteful emojis are okay (1-4 per post, never spammy).
- Match the requested tone exactly.

## Output Format
CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.

Produce exactly {$variantCount} variants. Each variant has:
- "post": string (the post copy, 60-180 words depending on platform; LinkedIn longer, Instagram/Facebook shorter; include one clear CTA line)
- "hashtags": array of 6-12 lowercase hashtag strings WITHOUT the # symbol (e.g. ["studyinnz", "epathways"])

Shape:
{
  "variants": [
    { "post": "...", "hashtags": ["...", "..."] }
  ]
}
PROMPT;
    }

    private function buildAdUserMessage(array $brief): string
    {
        $payload = [
            'ad_type' => $brief['ad_type'] ?? 'social',
            'platform' => $brief['platform'] ?? null,
            'topic' => $brief['topic'] ?? null,
            'product' => $brief['product'] ?? null,
            'audience' => $brief['audience'] ?? null,
            'tone' => $brief['tone'] ?? 'warm and professional',
            'key_points' => $brief['key_points'] ?? null,
            'cta' => $brief['cta'] ?? null,
            'language' => $brief['language'] ?? 'English',
            'variant_count' => $brief['variant_count'] ?? 3,
        ];

        return "Write the ad copy for this brief:\n\n".json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function analyze(Lead $lead): array
    {
        $lead->loadMissing(['studyPlans', 'educationExps', 'tags', 'documents', 'documentRequests']);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $this->buildSystemPrompt()],
                ['role' => 'user', 'content' => $this->buildUserMessage($lead)],
            ],
            'temperature' => 0.3,
        ]);

        if (! $response->successful()) {
            Log::error('Cerebras API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'lead_id' => $lead->lead_id,
            ]);
            throw new \RuntimeException('Cerebras API request failed: '.$response->status());
        }

        $content = $response->json('choices.0.message.content');

        if (! $content) {
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

        if (! isset($analysis['overall_score'], $analysis['categories'])) {
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

## Department Routing Rules

Recommend ONE primary department to take ownership of this lead next, based on the
applicant data, documents, and stage. Use exactly one of these labels:

- **Sales** — financially uncommitted, hasn't booked or paid; still needs persuasion
  and budget/timeline clarification. Default for fresh leads with weak intent signals.
- **Education** — has Bachelor's (or close to it), funds look workable, study pathway
  is the natural next conversation. Use when academic + financial signals are solid
  and the applicant is ready to choose a programme.
- **English** — English test missing, low (IELTS < 6.0 / equivalent), or score breakdown
  shows weakness; needs English Pro track before NZ application is realistic.
- **Immigration** — already enrolled or near-enrolled; ready for visa lodgement,
  needs immigration adviser to package the application. Also use when there are
  immigration risk factors (refusals, character/health) that need expert handling.
- **Accommodation** — visa work is done or imminent; lead is moving onto housing,
  airport pickup, settlement support in NZ.

Rules of thumb (apply in this order, take the FIRST that matches):
1. Heavy immigration risk (refusals, character/health issues) → Immigration
2. English missing/weak → English
3. Bachelor's + funds look workable + study path unclear → Education
4. Anything else (uncommitted, exploring, budget unclear) → Sales

Also produce a 1-sentence `department_reasoning` explaining *why* this department
should take it, referencing specific applicant data points.

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
  "recommended_department": "Education",
  "department_reasoning": "Bachelor's in relevant field with documented funding — ready to choose a programme, so Education adviser should take ownership next.",
  "next_steps": ["Send IELTS booking link", "Confirm sponsor documentation", "Schedule Education adviser consult"],
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
            'lead_status' => $lead->status,
            'staff_tags' => $lead->tags->pluck('name')->all(),
            'documents' => [
                'submitted_count' => $lead->documents->count(),
                'requested_count' => $lead->documentRequests->count(),
                'requested_labels' => $lead->documentRequests->pluck('label')->filter()->unique()->values()->all(),
                'approved_count' => $lead->documents->where('status', 'Approved')->count(),
                'rejected_count' => $lead->documents->where('status', 'Rejected')->count(),
            ],
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
                'qualifications' => $educationExps->map(fn ($e) => [
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

        return "Analyze this applicant's eligibility for studying in New Zealand:\n\n".json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
