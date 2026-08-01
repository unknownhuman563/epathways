<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadDocument;
use Google\Client as GoogleClient;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Illuminate\Support\Facades\Storage;

/**
 * Pushes APPROVED client documents into a per-client folder inside a Google
 * Workspace Shared Drive, using a service account. Each client gets one
 * folder (named by client name); every approved document lands inside it.
 *
 * Dormant until BOTH `services.google_drive.key_file` (a readable path to the
 * service-account JSON) and `services.google_drive.shared_drive_id` are set —
 * `isConfigured()` gates all callers, so the app runs normally without it.
 *
 * All Drive calls pass `supportsAllDrives`/Shared-Drive params because a
 * service account can only own files inside a Shared Drive, never My Drive.
 */
class GoogleDriveService
{
    private const FOLDER_MIME = 'application/vnd.google-apps.folder';

    private ?Drive $drive = null;

    public static function isConfigured(): bool
    {
        $keyFile = self::keyFilePath();

        return $keyFile !== null
            && is_file($keyFile)
            && filled(config('services.google_drive.shared_drive_id'));
    }

    /** Absolute path to the service-account JSON, or null. Relative paths resolve from base_path(). */
    private static function keyFilePath(): ?string
    {
        $path = config('services.google_drive.key_file');
        if (blank($path)) {
            return null;
        }

        // Allow a repo-relative path (e.g. storage/app/google/sa.json).
        return str_starts_with($path, '/') || preg_match('/^[A-Za-z]:\\\\/', $path)
            ? $path
            : base_path($path);
    }

    private function drive(): Drive
    {
        if ($this->drive) {
            return $this->drive;
        }

        $client = new GoogleClient;
        $client->setAuthConfig(self::keyFilePath());
        $client->setScopes([Drive::DRIVE]);

        return $this->drive = new Drive($client);
    }

    private function sharedDriveId(): string
    {
        return (string) config('services.google_drive.shared_drive_id');
    }

    /**
     * The single entry point the job calls: ensure the client folder exists,
     * then upload (or overwrite) this document inside it. Idempotent — a
     * document already synced updates the same Drive file, never duplicates.
     */
    public function syncApprovedDocument(LeadDocument $doc): void
    {
        $lead = $doc->lead;
        if (! $lead) {
            return;
        }

        [$disk, $path] = $this->resolveFile($doc);
        if (! $disk) {
            // Nothing on disk to upload — skip quietly (the caller logs).
            return;
        }

        $folderId = $this->ensureClientFolder($lead);
        $bytes = Storage::disk($disk)->get($path);
        $name = $doc->original_name ?: ('document-'.$doc->id.'.pdf');
        $mime = $doc->mime ?: 'application/octet-stream';

        if ($doc->gdrive_file_id) {
            // Overwrite the existing Drive file's contents in place.
            $this->drive()->files->update(
                $doc->gdrive_file_id,
                new DriveFile(['name' => $name]),
                ['data' => $bytes, 'mimeType' => $mime, 'uploadType' => 'multipart', 'supportsAllDrives' => true],
            );
            $fileId = $doc->gdrive_file_id;
        } else {
            $created = $this->drive()->files->create(
                new DriveFile(['name' => $name, 'parents' => [$folderId]]),
                ['data' => $bytes, 'mimeType' => $mime, 'uploadType' => 'multipart', 'supportsAllDrives' => true, 'fields' => 'id'],
            );
            $fileId = $created->getId();
        }

        $doc->forceFill([
            'gdrive_file_id' => $fileId,
            'gdrive_synced_at' => now(),
        ])->save();
    }

    /**
     * Find (or create) this client's folder in the Shared Drive, cache its id
     * on the lead, optionally share it with the configured recipient, and
     * store the human folder URL on `student_gdrive_link` so the existing
     * "Open GDrive" buttons work.
     */
    public function ensureClientFolder(Lead $lead): string
    {
        if ($lead->gdrive_folder_id) {
            return $lead->gdrive_folder_id;
        }

        $name = $this->folderName($lead);
        $folderId = $this->findFolder($name) ?? $this->createFolder($name);

        $webLink = 'https://drive.google.com/drive/folders/'.$folderId;
        $lead->forceFill([
            'gdrive_folder_id' => $folderId,
            // Only backfill the link if staff hasn't set one manually.
            'student_gdrive_link' => $lead->student_gdrive_link ?: $webLink,
        ])->save();

        $this->shareFolderIfConfigured($folderId);

        return $folderId;
    }

    private function folderName(Lead $lead): string
    {
        $client = trim("{$lead->first_name} {$lead->last_name}") ?: ('Client '.$lead->id);
        $prefix = (string) config('services.google_drive.folder_prefix', '');

        return trim($prefix.$client);
    }

    private function findFolder(string $name): ?string
    {
        $escaped = str_replace("'", "\\'", $name);
        $result = $this->drive()->files->listFiles([
            'q' => "name = '{$escaped}' and mimeType = '".self::FOLDER_MIME."' and trashed = false",
            'corpora' => 'drive',
            'driveId' => $this->sharedDriveId(),
            'includeItemsFromAllDrives' => true,
            'supportsAllDrives' => true,
            'fields' => 'files(id,name)',
            'pageSize' => 1,
        ]);

        $files = $result->getFiles();

        return $files ? $files[0]->getId() : null;
    }

    private function createFolder(string $name): string
    {
        $folder = $this->drive()->files->create(
            new DriveFile([
                'name' => $name,
                'mimeType' => self::FOLDER_MIME,
                'parents' => [$this->sharedDriveId()],
            ]),
            ['supportsAllDrives' => true, 'fields' => 'id'],
        );

        return $folder->getId();
    }

    private function shareFolderIfConfigured(string $folderId): void
    {
        $email = config('services.google_drive.share_with');
        if (blank($email)) {
            return;
        }

        $this->drive()->permissions->create(
            $folderId,
            new Permission(['type' => 'user', 'role' => 'reader', 'emailAddress' => $email]),
            ['supportsAllDrives' => true, 'sendNotificationEmail' => false],
        );
    }

    /**
     * Resolve which disk holds the document file. Mirrors the download
     * controller's local-first, public-fallback resolution so it works
     * regardless of where the upload originally landed.
     *
     * @return array{0: ?string, 1: string}
     */
    private function resolveFile(LeadDocument $doc): array
    {
        $path = (string) $doc->file_path;
        if ($path === '') {
            return [null, ''];
        }
        if (Storage::disk('local')->exists($path)) {
            return ['local', $path];
        }
        if (Storage::disk('public')->exists($path)) {
            return ['public', $path];
        }

        return [null, $path];
    }
}
