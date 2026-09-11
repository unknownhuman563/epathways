<?php

namespace Tests\Feature\Immigration;

use App\Services\AIService;
use App\Services\Immigration\RfiDocumentExtractor;
use Tests\TestCase;

/**
 * The RFI extractor turns an INZ letter's text into the list of documents the
 * applicant must provide. It is grounded (extracts only what the letter names),
 * bounded, and degrades safely — it must never throw into the request.
 */
class RfiDocumentExtractorTest extends TestCase
{
    /** A stand-in AIService that returns a canned model reply (no network). */
    private function fakeAi(string $content): AIService
    {
        return new class($content) extends AIService
        {
            public function __construct(private string $canned) {}

            public function chat(array $messages, ?string $model = null): array
            {
                return ['content' => $this->canned, 'tokens' => 10, 'model' => 'test'];
            }
        };
    }

    public function test_maps_the_models_json_into_requested_documents(): void
    {
        $ai = $this->fakeAi('{"deadline":"2026-09-16","documents":[{"label":"Updated bank statements","description":"Last 6 months"},{"label":"Police certificate","description":""}]}');
        $out = (new RfiDocumentExtractor($ai))->extractFromText('INZ requests further information...');

        $this->assertSame('2026-09-16', $out['deadline']);
        $this->assertCount(2, $out['documents']);
        $this->assertSame('Updated bank statements', $out['documents'][0]['label']);
        $this->assertSame('Last 6 months', $out['documents'][0]['description']);
        $this->assertSame('Police certificate', $out['documents'][1]['label']);
        $this->assertSame('', $out['documents'][1]['description']);
    }

    public function test_tolerates_code_fences_and_skips_blank_labels(): void
    {
        $ai = $this->fakeAi("```json\n{\"deadline\":null,\"documents\":[{\"label\":\"Passport bio page\"},{\"label\":\"\"},{\"description\":\"orphan\"}]}\n```");
        $out = (new RfiDocumentExtractor($ai))->extractFromText('...');

        $this->assertNull($out['deadline']);
        $this->assertCount(1, $out['documents']);
        $this->assertSame('Passport bio page', $out['documents'][0]['label']);
    }

    public function test_a_non_json_reply_yields_an_empty_result_not_an_error(): void
    {
        $ai = $this->fakeAi('I could not find any documents.');
        $out = (new RfiDocumentExtractor($ai))->extractFromText('...');

        $this->assertNull($out['deadline']);
        $this->assertSame([], $out['documents']);
    }

    public function test_an_absurd_deadline_is_dropped(): void
    {
        $ai = $this->fakeAi('{"deadline":"within 14 days","documents":[]}');
        $out = (new RfiDocumentExtractor($ai))->extractFromText('...');

        $this->assertNull($out['deadline']);
    }

    public function test_extract_reports_no_text_for_an_unreadable_pdf(): void
    {
        // A path with no readable PDF text short-circuits before any AI call.
        $ai = $this->fakeAi('{"deadline":"2026-09-16","documents":[{"label":"should not be used"}]}');
        $result = (new RfiDocumentExtractor($ai))->extract([__FILE__]); // this .php file has no PDF text

        $this->assertFalse($result['text_found']);
        $this->assertFalse($result['ai_used']);
        $this->assertNull($result['deadline']);
        $this->assertSame([], $result['documents']);
    }
}
