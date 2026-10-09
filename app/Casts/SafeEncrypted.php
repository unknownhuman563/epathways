<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Encrypted string cast that fails soft on read.
 *
 * Identical to Laravel's built-in "encrypted" cast for writing, but when a
 * stored value cannot be decrypted — e.g. it was encrypted under a previous
 * APP_KEY (key rotation, or data copied between environments) — it returns
 * null and logs a warning instead of throwing "The MAC is invalid".
 *
 * Rationale: a single undecryptable PII value must not crash the request. The
 * immigration cases list, for instance, reads passport numbers for every case
 * to build its rows; one legacy/corrupt value used to throw and (via the
 * method's catch-all) blank the ENTIRE list. An unreadable ciphertext exposes
 * nothing, so degrading it to null is safe.
 */
class SafeEncrypted implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            Log::warning('SafeEncrypted: undecryptable value (likely an APP_KEY mismatch)', [
                'model' => get_class($model),
                'id' => $model->getKey(),
                'attribute' => $key,
            ]);

            return null;
        }
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : Crypt::encryptString((string) $value);
    }
}
