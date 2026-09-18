<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * One-off helper to (a) test whether the Google Business Profile API access is
 * approved for our project and (b) mint the refresh token + account/location
 * IDs we need for the reviews sync.
 *
 * Usage:
 *   1) php artisan google:business-auth
 *      → prints a consent URL. Open it signed in as the account that MANAGES
 *        the Google Business Profile (a test user on the consent screen).
 *        After "Allow", the browser redirects to http://localhost/?code=... —
 *        the page won't load; copy the `code` value from the address bar.
 *   2) php artisan google:business-auth --code=THE_CODE
 *      → exchanges the code and calls the API. The output tells us clearly
 *        whether access is APPROVED (accounts/reviews returned) or PENDING
 *        (403 / "API not enabled or blocked").
 */
class GoogleBusinessAuth extends Command
{
    protected $signature = 'google:business-auth
        {--code= : The authorization code copied from the redirect URL}
        {--listen : Auto-capture the code by listening on 127.0.0.1:9004 (no copy-paste)}
        {--port=9004 : Loopback port to listen on in --listen mode}
        {--redirect=http://localhost : OAuth redirect URI (must match the OAuth client)}';

    protected $description = 'Test Google Business Profile API approval + mint a refresh token';

    private const SCOPE = 'https://www.googleapis.com/auth/business.manage';

    public function handle(): int
    {
        $clientId = config('services.google_business.client_id');
        $clientSecret = config('services.google_business.client_secret');
        $redirect = (string) $this->option('redirect');

        if (! $clientId || ! $clientSecret) {
            $this->error('GOOGLE_BUSINESS_CLIENT_ID / CLIENT_SECRET are not set in .env.');

            return self::FAILURE;
        }

        $code = $this->option('code');

        // ── Auto-capture mode: listen locally, print URL, grab the code ─
        if ($this->option('listen') && ! $code) {
            $port = (int) $this->option('port');
            $redirect = "http://127.0.0.1:{$port}";

            $errno = 0;
            $errstr = '';
            $server = @stream_socket_server("tcp://127.0.0.1:{$port}", $errno, $errstr);
            if (! $server) {
                $this->error("Could not listen on 127.0.0.1:{$port} ({$errstr}). Try --port=9006.");

                return self::FAILURE;
            }

            $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirect,
                'response_type' => 'code',
                'scope' => self::SCOPE,
                'access_type' => 'offline',
                'prompt' => 'consent',
            ]);

            $this->info('Open this URL, sign in as the Business-Profile account, and click Allow:');
            $this->newLine();
            $this->line($url);
            $this->newLine();
            $this->info("Waiting for the redirect on 127.0.0.1:{$port} … (Ctrl+C to cancel)");

            // The browser may open several connections to this port (page +
            // favicon + preconnects). Accept a few until one carries ?code=,
            // reading each request's full first line before parsing.
            $deadline = time() + 300;
            while (time() < $deadline && ! $code) {
                $conn = @stream_socket_accept($server, max(1, $deadline - time()));
                if (! $conn) {
                    break;
                }

                // Read until we have the whole request line (ends with \r\n).
                stream_set_timeout($conn, 2);
                $request = '';
                while (! str_contains($request, "\r\n") && strlen($request) < 65535) {
                    $chunk = fread($conn, 4096);
                    if ($chunk === '' || $chunk === false) {
                        break;
                    }
                    $request .= $chunk;
                }

                preg_match('/GET\s+(\S+)\s+HTTP/i', $request, $m);
                $path = $m[1] ?? '';
                parse_str((string) parse_url($path, PHP_URL_QUERY), $q);
                $found = $q['code'] ?? null;

                if ($found) {
                    $code = $found;
                    $body = '<h2>&#10004; Authorized — close this tab and return to the terminal.</h2>';
                } else {
                    // Not the code request (e.g. favicon) — ack and keep listening.
                    $body = '<h2>Waiting for authorization…</h2>';
                }
                fwrite($conn, "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n{$body}");
                fclose($conn);
            }
            fclose($server);

            if (! $code) {
                $this->error('Timed out or no code received. Re-run and click Allow within 5 minutes.');

                return self::FAILURE;
            }
            $this->info('✓ Captured the authorization code automatically. (length='.strlen($code).')');
        }

        // ── Step 1: print the consent URL ──────────────────────────────
        if (! $code) {
            $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirect,
                'response_type' => 'code',
                'scope' => self::SCOPE,
                'access_type' => 'offline',
                'prompt' => 'consent',
            ]);

            $this->info('1) Open this URL, signed in as the Business-Profile-managing Google account:');
            $this->newLine();
            $this->line($url);
            $this->newLine();
            $this->info('2) After "Allow", the browser goes to '.$redirect.'/?code=...  (the page will not load).');
            $this->info('   Copy the `code` value from the address bar, then run:');
            $this->line('   php artisan google:business-auth --code=PASTE_CODE_HERE');

            return self::SUCCESS;
        }

        // ── Step 2: exchange the code for tokens ───────────────────────
        $this->info('Exchanging authorization code for tokens…');
        $tok = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirect,
            'grant_type' => 'authorization_code',
        ]);

        if (! $tok->successful()) {
            $this->error('Token exchange failed ('.$tok->status().'):');
            $this->line($tok->body());
            $this->warn('If this says redirect_uri_mismatch, re-run step 1 with --redirect=urn:ietf:wg:oauth:2.0:oob');

            return self::FAILURE;
        }

        $access = $tok->json('access_token');
        $refresh = $tok->json('refresh_token');

        $this->newLine();
        $this->info('✓ Token exchange OK.');
        if ($refresh) {
            $this->newLine();
            $this->line('  GOOGLE_BUSINESS_REFRESH_TOKEN='.$refresh);
            $this->warn('  ↑ Put this in the SERVER .env (and rotate the OAuth secret afterwards).');
        } else {
            $this->warn('  No refresh_token returned — re-run step 1 (it needs prompt=consent + access_type=offline).');
        }

        // ── Step 3: the real approval test — list accounts ─────────────
        $this->newLine();
        $this->info('Calling the Business Profile Account Management API…');
        $acc = Http::withToken($access)
            ->get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');

        if (! $acc->successful()) {
            $this->error('Accounts call failed ('.$acc->status().'):');
            $this->line($acc->body());
            $this->newLine();
            $this->warn('A 403 with "has not been used in project ... or it is disabled" or "PERMISSION_DENIED"');
            $this->warn('means the API is NOT approved/enabled yet. A 429 means approved but over quota.');

            return self::FAILURE;
        }

        $accounts = $acc->json('accounts', []);
        $this->info('✓ APPROVED — Account Management API returned '.count($accounts).' account(s).');
        foreach ($accounts as $a) {
            $this->line('   '.($a['name'] ?? '?').'  —  '.($a['accountName'] ?? ''));
        }

        // ── Step 4: reviews (My Business v4) for the first location ────
        $accountName = $accounts[0]['name'] ?? null; // e.g. "accounts/123"
        if ($accountName) {
            $this->newLine();
            $this->info('Listing locations…');
            $loc = Http::withToken($access)->get(
                "https://mybusinessbusinessinformation.googleapis.com/v1/{$accountName}/locations",
                ['readMask' => 'name,title', 'pageSize' => 10]
            );
            if ($loc->successful()) {
                foreach ($loc->json('locations', []) as $l) {
                    $this->line('   '.($l['name'] ?? '?').'  —  '.($l['title'] ?? ''));
                }
                $accId = str_replace('accounts/', '', $accountName);
                $firstLoc = $loc->json('locations.0.name'); // "locations/456"
                if ($firstLoc) {
                    $locId = str_replace('locations/', '', $firstLoc);
                    $this->newLine();
                    $this->line('  GOOGLE_BUSINESS_ACCOUNT_ID='.$accId);
                    $this->line('  GOOGLE_BUSINESS_LOCATION_ID='.$locId);
                    $this->newLine();
                    $this->info('Fetching reviews (My Business v4)…');
                    $rev = Http::withToken($access)->get(
                        "https://mybusiness.googleapis.com/v4/accounts/{$accId}/locations/{$locId}/reviews"
                    );
                    if ($rev->successful()) {
                        $this->info('✓ Reviews API OK — total='.($rev->json('totalReviewCount') ?? 0).', avg='.($rev->json('averageRating') ?? '—'));
                    } else {
                        $this->warn('Reviews call ('.$rev->status().'): '.$rev->body());
                    }
                }
            } else {
                $this->warn('Locations call ('.$loc->status().'): '.$loc->body());
            }
        }

        return self::SUCCESS;
    }
}
