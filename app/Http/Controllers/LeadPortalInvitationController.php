<?php

namespace App\Http\Controllers;

use App\Mail\LeadPortalCredentials;
use App\Mail\LeadPortalInvitation;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Two-step Lead Portal access gate:
 *
 *   sales agent  ─ request() ─►  status=pending
 *   admin        ─ approve() ─►  status=sent + email dispatched + signed URL valid 7 days
 *   lead         ─ setup()   ─►  password set, User row created, status=accepted, auto-login
 *
 * Admin may revoke() at any time which disables login without deleting history.
 */
class LeadPortalInvitationController extends Controller
{
    private const TOKEN_TTL_DAYS = 7;

    // ── Admin: pending requests + sent/accepted/revoked overview ────────────

    public function adminIndex()
    {
        $invitations = Lead::whereIn('portal_invitation_status', ['pending', 'sent', 'accepted', 'revoked'])
            ->with(['portalUser:id,lead_id,email,last_login_at'])
            ->orderByRaw("FIELD(portal_invitation_status, 'pending', 'sent', 'accepted', 'revoked')")
            ->orderByDesc('portal_invitation_requested_at')
            ->get()
            ->map(fn (Lead $l) => [
                'id'           => $l->id,
                'lead_id'      => $l->lead_id,
                'name'         => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'email'        => $l->email,
                'status'       => $l->portal_invitation_status,
                'requested_at' => $l->portal_invitation_requested_at,
                'requested_by' => optional(User::find($l->portal_invitation_requested_by))->name,
                'approved_at'  => $l->portal_invitation_approved_at,
                'approved_by'  => optional(User::find($l->portal_invitation_approved_by))->name,
                'accepted_at'  => $l->portal_invitation_accepted_at,
                'expires_at'   => $l->portal_invitation_expires_at,
                'has_account'  => (bool) $l->portalUser,
                // Which pipeline the person belongs to, for the page tabs. A
                // converted immigration case takes priority over a student
                // conversion; otherwise it's still a plain lead.
                'type'         => $l->is_immigration_case ? 'case' : ($l->is_student ? 'student' : 'lead'),
            ]);

        return inertia('admin/PortalInvitations', [
            'invitations' => $invitations,
        ]);
    }

    // ── Sales: request portal access for a lead ─────────────────────────────

    public function request(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        if (! $lead->email) {
            return back()->withErrors(['error' => 'This lead has no email on file. Add one before requesting portal access.']);
        }
        if (! in_array($lead->portal_invitation_status, ['none', 'revoked'], true)) {
            return back()->withErrors(['error' => "Portal access is already {$lead->portal_invitation_status}."]);
        }

        $lead->update([
            'portal_invitation_status'       => 'pending',
            'portal_invitation_requested_by' => Auth::id(),
            'portal_invitation_requested_at' => now(),
            // Clear any prior approval audit so this is a fresh request
            'portal_invitation_approved_by'  => null,
            'portal_invitation_approved_at'  => null,
            'portal_invitation_token'        => null,
            'portal_invitation_expires_at'   => null,
        ]);

        return back()->with('success', "Portal access requested for {$lead->first_name}. Awaiting admin approval.");
    }

    // ── Admin: approve a pending request (dispatches the email) ─────────────

    public function approve(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        if ($lead->portal_invitation_status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending requests can be approved.']);
        }

        // Plain token in the email; only the hash lives in the DB. Single-use.
        $plainToken = Str::random(48);

        try {
            DB::transaction(function () use ($lead, $plainToken) {
                $lead->update([
                    'portal_invitation_status'      => 'sent',
                    'portal_invitation_approved_by' => Auth::id(),
                    'portal_invitation_approved_at' => now(),
                    'portal_invitation_token'       => hash('sha256', $plainToken),
                    'portal_invitation_expires_at'  => now()->addDays(self::TOKEN_TTL_DAYS),
                ]);

                Mail::to($lead->email)->send(new LeadPortalInvitation($lead, $plainToken));
            });
        } catch (\Throwable $e) {
            Log::error('Lead portal invitation approval failed', ['lead_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not send the invitation. Check the mail log.']);
        }

        // Also expose the link in flash so admin can copy/paste it during
        // demo if SMTP isn't configured yet (mail driver = log).
        $setupUrl = route('lead-portal.setup', ['token' => $plainToken]);

        return back()->with([
            'success'                  => "Invitation sent to {$lead->email}.",
            'invitation_link'          => $setupUrl,
            'invitation_link_lead_id'  => $lead->lead_id,
        ]);
    }

    // ── Admin: reject a pending request ─────────────────────────────────────

    public function reject(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        if ($lead->portal_invitation_status !== 'pending') {
            return back()->withErrors(['error' => 'Only pending requests can be rejected.']);
        }

        $lead->update([
            'portal_invitation_status'      => 'none',
            'portal_invitation_requested_by' => null,
            'portal_invitation_requested_at' => null,
        ]);

        return back()->with('success', 'Request rejected.');
    }

    // ── Admin: revoke an accepted account (disables login) ──────────────────

    public function revoke(Request $request, $id)
    {
        $lead = Lead::with('portalUser')->findOrFail($id);

        if (! in_array($lead->portal_invitation_status, ['sent', 'accepted'], true)) {
            return back()->withErrors(['error' => 'Nothing to revoke.']);
        }

        DB::transaction(function () use ($lead) {
            // Soft-disable the User by clearing password & changing role so
            // they can't re-authenticate, but keep history intact.
            if ($lead->portalUser) {
                $lead->portalUser->update([
                    'password' => Hash::make(Str::random(64)),
                    'role'     => 'revoked_lead',
                ]);
            }
            $lead->update([
                'portal_invitation_status'     => 'revoked',
                'portal_invitation_token'      => null,
                'portal_invitation_expires_at' => null,
            ]);
        });

        return back()->with('success', 'Portal access revoked.');
    }

    // ── Lead: open the password-setup page from the email link ──────────────

    public function setup(Request $request, string $token)
    {
        $lead = Lead::where('portal_invitation_token', hash('sha256', $token))->first();

        if (! $lead || ! $this->isTokenUsable($lead)) {
            return inertia('lead-portal/InvitationInvalid');
        }

        return inertia('lead-portal/SetupAccount', [
            'token' => $token,
            'lead'  => [
                'first_name' => $lead->first_name,
                'last_name'  => $lead->last_name,
                'email'      => $lead->email,
            ],
        ]);
    }

    // ── Lead: submit chosen password → create User → auto-login ─────────────

    public function store(Request $request, string $token)
    {
        $request->validate([
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        $lead = Lead::where('portal_invitation_token', hash('sha256', $token))->first();

        if (! $lead || ! $this->isTokenUsable($lead)) {
            return redirect()->route('lead-portal.setup', ['token' => $token])
                ->withErrors(['token' => 'This invitation has expired or been used.']);
        }

        try {
            $user = DB::transaction(function () use ($lead, $request) {
                $user = User::create([
                    'name'     => trim("{$lead->first_name} {$lead->last_name}") ?: 'Lead',
                    'email'    => $lead->email,
                    'password' => $request->password,
                    'role'     => User::ROLE_LEAD,
                    'lead_id'  => $lead->id,
                ]);

                $lead->update([
                    'portal_invitation_status'        => 'accepted',
                    'portal_invitation_token'         => null,
                    'portal_invitation_expires_at'    => null,
                    'portal_invitation_accepted_at'   => now(),
                ]);

                return $user;
            });

            Auth::login($user);
            return redirect('/portal/lead/dashboard');
        } catch (\Throwable $e) {
            Log::error('Lead portal setup failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['password' => 'Could not set up your account. Please try the link again.']);
        }
    }

    // ── Admin: generate credentials directly (skip the email-link flow) ─────
    //
    // For cases where SMTP is unavailable or the admin wants to hand the
    // credentials to the lead via WhatsApp / phone. The plain password is
    // returned ONCE via flash — never recoverable after that.

    public function generateCredentials(Request $request, $id)
    {
        $lead = Lead::with('portalUser')->findOrFail($id);

        if (! $lead->email) {
            return back()->withErrors(['error' => 'This lead has no email on file. Add one before generating credentials.']);
        }
        if ($lead->portalUser) {
            return back()->withErrors(['error' => 'This lead already has an account. Use Reset password instead.']);
        }
        // Prevent collision with a non-lead account using the same email.
        if (User::where('email', $lead->email)->exists()) {
            return back()->withErrors(['error' => "A user with email {$lead->email} already exists in the system."]);
        }

        // Generated login password = first name + last 4 digits of the
        // reference (e.g. "Maria1234"). Easy to relay; the credentials email
        // still asks the client to change it after first login.
        $plainPassword = $this->credentialPassword($lead);

        try {
            DB::transaction(function () use ($lead, $plainPassword) {
                User::create([
                    'name'     => trim("{$lead->first_name} {$lead->last_name}") ?: 'Lead',
                    'email'    => $lead->email,
                    'password' => $plainPassword, // cast as hashed on save
                    'role'     => User::ROLE_LEAD,
                    'lead_id'  => $lead->id,
                ]);

                $lead->update([
                    'portal_invitation_status'       => 'accepted',
                    'portal_invitation_approved_by'  => $lead->portal_invitation_approved_by ?: Auth::id(),
                    'portal_invitation_approved_at'  => $lead->portal_invitation_approved_at ?: now(),
                    'portal_invitation_token'        => null,
                    'portal_invitation_expires_at'   => null,
                    'portal_invitation_accepted_at'  => now(),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('Lead portal generateCredentials failed', ['lead_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not generate credentials. Please try again.']);
        }

        // Email the client their login details directly. Best-effort: the
        // account is already created, and the password is still shown once in
        // the admin modal below, so a mail failure never loses the credential —
        // the admin can copy it and send it by hand.
        $emailSent = false;
        try {
            Mail::to($lead->email)->send(new LeadPortalCredentials($lead, $plainPassword));
            $emailSent = true;
        } catch (\Throwable $e) {
            Log::warning('Lead portal credentials email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }

        return back()->with([
            'success' => $emailSent
                ? "Login details emailed to {$lead->email}. Copy the password below too — it won't be shown again."
                : "Account created for {$lead->email}, but the email could not be sent. Copy the password below and send it to the client manually.",
            'generated_credentials'      => [
                'email'    => $lead->email,
                'password' => $plainPassword,
                'lead_id'  => $lead->lead_id,
                'name'     => trim("{$lead->first_name} {$lead->last_name}"),
                'email_sent' => $emailSent,
            ],
        ]);
    }

    // ── Admin: reset password on an existing lead account ───────────────────

    public function resetPassword(Request $request, $id)
    {
        $lead = Lead::with('portalUser')->findOrFail($id);

        if (! $lead->portalUser) {
            return back()->withErrors(['error' => 'No portal account exists for this lead yet.']);
        }

        // Reset to the same easy-to-relay format as Generate (full name + "@" +
        // last 4 of the reference). Shown once in the admin modal; the client
        // is prompted to change it after logging back in.
        $plainPassword = $this->credentialPassword($lead);

        try {
            $lead->portalUser->update([
                'password' => $plainPassword, // cast as hashed on save
                'role'     => User::ROLE_LEAD, // re-enable if previously revoked
            ]);

            // If the account was revoked, mark it accepted again so it shows
            // in the Active section instead of Revoked.
            if ($lead->portal_invitation_status === 'revoked') {
                $lead->update([
                    'portal_invitation_status'       => 'accepted',
                    'portal_invitation_accepted_at'  => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Lead portal resetPassword failed', ['lead_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not reset the password. Please try again.']);
        }

        return back()->with([
            'success'                  => "Password reset for {$lead->email}. Copy now — the new password will not be shown again.",
            'generated_credentials'    => [
                'email'    => $lead->email,
                'password' => $plainPassword,
                'lead_id'  => $lead->lead_id,
                'name'     => trim("{$lead->first_name} {$lead->last_name}"),
            ],
        ]);
    }

    /**
     * Deterministic login password that always satisfies the standard
     * complexity rules — at least 8 characters with an uppercase letter, a
     * lowercase letter, a digit and a symbol.
     *
     * Built from the client's full name (letters only, each part capitalised,
     * no spaces) + "@" + the last 4 digits of their reference, e.g.
     * "MariaSantos@1234". The trailing block guarantees every rule even for
     * edge cases (blank, very short or all-caps names).
     */
    private function credentialPassword(Lead $lead): string
    {
        $fullName = trim("{$lead->first_name} {$lead->last_name}");
        $name = preg_replace('/[^A-Za-z]/', '', ucwords(strtolower($fullName)));
        if ($name === '') {
            $name = 'Client';
        }

        $digits = preg_replace('/\D/', '', (string) $lead->lead_id);
        if ($digits === '') {
            $digits = (string) $lead->id;
        }
        $last4 = substr(str_pad($digits, 4, '0', STR_PAD_LEFT), -4);

        $password = $name.'@'.$last4;

        // Guarantee each rule regardless of the input name (digit and symbol
        // are always present via the reference block and "@").
        if (! preg_match('/[a-z]/', $password)) {
            $password .= 'a';
        }
        if (! preg_match('/[A-Z]/', $password)) {
            $password .= 'A';
        }
        // Pad up to the 8-character minimum for very short names.
        while (strlen($password) < 8) {
            $password .= '0';
        }

        return $password;
    }

    /**
     * Random 12-char password that's strong but readable when read aloud.
     * Avoids visually-confusing chars (0/O, 1/l/I) and uses lowercase +
     * uppercase + digits. Roughly 64 bits of entropy. Currently unused by the
     * generate/reset flows (both use credentialPassword) — kept for callers
     * that want a non-guessable one-shot secret.
     */
    private function generateReadablePassword(): string
    {
        $upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O
        $lower  = 'abcdefghjkmnpqrstuvwxyz';  // no i, l, o
        $digits = '23456789';                 // no 0, 1
        $alphabet = $upper . $lower . $digits;

        // Guarantee at least one of each character class
        $chars = [
            $upper[random_int(0, strlen($upper) - 1)],
            $lower[random_int(0, strlen($lower) - 1)],
            $digits[random_int(0, strlen($digits) - 1)],
        ];
        for ($i = count($chars); $i < 12; $i++) {
            $chars[] = $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        shuffle($chars);
        return implode('', $chars);
    }

    /** Token is single-use, must exist, must not be expired. */
    private function isTokenUsable(Lead $lead): bool
    {
        return $lead->portal_invitation_status === 'sent'
            && $lead->portal_invitation_token !== null
            && $lead->portal_invitation_expires_at
            && $lead->portal_invitation_expires_at->isFuture();
    }
}
