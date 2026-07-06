<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Bakes the two CTA pill buttons (BOOK NOW / CALL …) directly onto a footer
 * image. Gmail allows no true HTML overlay on an image, so the only way to
 * show buttons "on" the footer is to render them into the pixels — which is
 * exactly what the original template did.
 *
 * composeUrl() persists the result to public storage and returns a public URL
 * so the email can reference it with a plain <img src> (no CID embed → no
 * "attachment" in Gmail). composeBytes() returns the raw bytes for callers
 * that need them.
 */
class EmailFooterComposer
{
    private const FONT = 'DejaVuSans-Bold.ttf';

    /**
     * Composite the footer (cached by source + labels) and return a public URL
     * to the result, or null if it can't be produced.
     */
    public function composeUrl(string $imagePath, string $bookLabel, ?string $callLabel): ?string
    {
        if (! is_file($imagePath)) {
            return null;
        }

        $key = md5($imagePath.'|'.(@filemtime($imagePath) ?: 0).'|'.$bookLabel.'|'.$callLabel);
        $rel = 'email-footers/'.$key.'.jpg';
        $disk = Storage::disk('public');

        if (! $disk->exists($rel)) {
            $bytes = $this->composeBytes($imagePath, $bookLabel, $callLabel);
            if (! $bytes) {
                return null;
            }
            $disk->put($rel, $bytes);
        }

        return $this->toAbsolute($disk->url($rel));
    }

    private function toAbsolute(string $url): string
    {
        return Str::startsWith($url, ['http://', 'https://'])
            ? $url
            : rtrim((string) config('app.url'), '/').'/'.ltrim($url, '/');
    }

    /**
     * @return string|null Composited (or original) PNG/JPEG bytes, or null if
     *                     the source can't be read at all.
     */
    public function composeBytes(string $imagePath, string $bookLabel, ?string $callLabel): ?string
    {
        if (! is_file($imagePath)) {
            return null;
        }

        $raw = @file_get_contents($imagePath) ?: null;

        if (! extension_loaded('gd') || ! function_exists('imagettftext')) {
            return $raw;
        }

        $font = resource_path('fonts/'.self::FONT);
        if (! is_file($font)) {
            return $raw;
        }

        try {
            $img = @imagecreatefromstring($raw);
            if (! $img) {
                return $raw;
            }

            imagealphablending($img, true);
            imagesavealpha($img, true);

            $w = imagesx($img);
            $h = imagesy($img);

            $labels = array_values(array_filter([$bookLabel, $callLabel], fn ($l) => $l !== null && $l !== ''));
            $count = count($labels);
            if ($count === 0) {
                return $raw;
            }

            // Buttons sit in a single centered ROW (side by side): BOOK NOW on
            // the left, CALL on the right. Geometry scales with image width.
            $btnH = max(40, (int) round($w * 0.062));
            $gap = (int) round($w * 0.03);
            $btnW = $count > 1
                ? (int) round(($w * 0.88 - ($count - 1) * $gap) / $count)
                : (int) round($w * 0.5);

            $rowW = $count * $btnW + ($count - 1) * $gap;
            $x0 = (int) round(($w - $rowW) / 2);
            // Vertical position — lower-middle of the image.
            $y = (int) round($h * 0.68 - $btnH / 2);
            $y = max($y, (int) round($h * 0.06));

            $green = imagecolorallocate($img, 46, 125, 50);    // #2e7d32
            $darkGreen = imagecolorallocate($img, 27, 94, 32); // #1b5e20
            $white = imagecolorallocate($img, 255, 255, 255);

            foreach ($labels as $i => $label) {
                $bx = $x0 + $i * ($btnW + $gap);
                $this->pill($img, $bx, $y, $btnW, $btnH, $i === 0 ? $green : $darkGreen);
                $this->centeredText($img, $bx, $y, $btnW, $btnH, $font, $white, $label);
            }

            // Flatten onto white and emit JPEG — a PNG of a photo is ~1MB and
            // bloats the email (hurts deliverability); JPEG is ~150KB.
            $flat = imagecreatetruecolor($w, $h);
            $bg = imagecolorallocate($flat, 255, 255, 255);
            imagefilledrectangle($flat, 0, 0, $w, $h, $bg);
            imagecopy($flat, $img, 0, 0, 0, 0, $w, $h);

            ob_start();
            imagejpeg($flat, null, 85);
            $out = ob_get_clean();
            imagedestroy($img);
            imagedestroy($flat);

            return $out ?: $raw;
        } catch (\Throwable $e) {
            Log::warning('EmailFooterComposer failed', ['error' => $e->getMessage()]);

            return $raw;
        }
    }

    /** Draw a fully-rounded ("pill") filled rectangle. */
    private function pill($img, int $x, int $y, int $w, int $h, int $color): void
    {
        $r = (int) round($h / 2);
        imagefilledrectangle($img, $x + $r, $y, $x + $w - $r, $y + $h, $color);
        imagefilledellipse($img, $x + $r, $y + $r, $h, $h, $color);
        imagefilledellipse($img, $x + $w - $r, $y + $r, $h, $h, $color);
    }

    /** Draw white bold text centred within a button box, auto-shrunk to fit. */
    private function centeredText($img, int $x, int $y, int $w, int $h, string $font, int $color, string $text): void
    {
        $size = max(9, (int) round($h * 0.30));

        // Shrink until the text fits inside the pill with padding.
        for (; $size >= 8; $size--) {
            $box = imagettfbbox($size, 0, $font, $text);
            $tw = abs($box[2] - $box[0]);
            if ($tw <= $w - $h) {
                break;
            }
        }

        $box = imagettfbbox($size, 0, $font, $text);
        $tw = abs($box[2] - $box[0]);
        $th = abs($box[7] - $box[1]);
        $tx = $x + (int) round(($w - $tw) / 2);
        $ty = $y + (int) round(($h + $th) / 2);

        imagettftext($img, $size, 0, $tx, $ty, $color, $font, $text);
    }
}
