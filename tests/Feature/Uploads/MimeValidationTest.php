<?php

namespace Tests\Feature\Uploads;

use App\Support\UploadValidation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class MimeValidationTest extends TestCase
{
    private function passes(string $rule, UploadedFile $file): bool
    {
        return Validator::make(['file' => $file], ['file' => $rule])->passes();
    }

    public function test_lead_document_accepts_pdf(): void
    {
        $file = UploadedFile::fake()->create('passport.pdf', 200, 'application/pdf');
        $this->assertTrue($this->passes(UploadValidation::document(), $file));
    }

    public function test_lead_document_rejects_exe(): void
    {
        $file = UploadedFile::fake()->create('malware.exe', 200, 'application/x-msdownload');
        $this->assertFalse($this->passes(UploadValidation::document(), $file));
    }

    public function test_lead_document_rejects_php(): void
    {
        $file = UploadedFile::fake()->create('shell.php', 50, 'application/x-httpd-php');
        $this->assertFalse($this->passes(UploadValidation::document(), $file));
    }

    public function test_image_context_accepts_png(): void
    {
        $file = UploadedFile::fake()->image('photo.png', 300, 300);
        $this->assertTrue($this->passes(UploadValidation::image(), $file));
    }

    public function test_image_context_rejects_pdf(): void
    {
        // A PDF is a valid document but not a valid image — wrong context.
        $file = UploadedFile::fake()->create('doc.pdf', 200, 'application/pdf');
        $this->assertFalse($this->passes(UploadValidation::image(), $file));
    }

    public function test_task_attachment_accepts_csv(): void
    {
        $file = UploadedFile::fake()->create('data.csv', 100, 'text/csv');
        $this->assertTrue($this->passes(UploadValidation::taskAttachment(), $file));
    }

    public function test_task_attachment_rejects_exe(): void
    {
        $file = UploadedFile::fake()->create('x.exe', 100, 'application/x-msdownload');
        $this->assertFalse($this->passes(UploadValidation::taskAttachment(), $file));
    }

    public function test_error_message_identifies_allowed_types(): void
    {
        $file = UploadedFile::fake()->create('x.exe', 100, 'application/x-msdownload');
        $validator = Validator::make(['file' => $file], ['file' => UploadValidation::document()]);

        $this->assertTrue($validator->fails());
        $message = $validator->errors()->first('file');
        $this->assertStringContainsString('pdf', $message);
        $this->assertStringContainsString('xlsx', $message);
    }

    public function test_oversized_image_is_rejected(): void
    {
        // 6 MB image against the 5 MB image cap.
        $file = UploadedFile::fake()->create('big.png', 6 * 1024, 'image/png');
        $this->assertFalse($this->passes(UploadValidation::image(), $file));
    }
}
