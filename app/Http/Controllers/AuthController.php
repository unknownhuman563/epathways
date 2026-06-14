<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('auth/Login');
    }

    /**
     * Handle an authentication attempt.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Stamp last_login_at so admins can see which lead accounts are
            // dormant. Quiet update — no model events fire.
            $user->forceFill(['last_login_at' => now()])->saveQuietly();

            ActivityLog::record('login', ['description' => $user->name.' signed in']);

            // Leads always land on their own dashboard — bypass intended()
            // which can carry over an admin URL from a prior session and
            // cause a misleading 403 immediately after login.
            if ($user->isLead()) {
                return redirect()->to($user->homeRoute())
                    ->with('success', 'Welcome back, '.$user->name.'!');
            }

            return redirect()->intended($user->homeRoute())
                ->with('success', 'Welcome back, '.$user->name.'!');
        }

        ActivityLog::record('login.failed', [
            'actor_name' => $credentials['email'],
            'portal' => 'public',
            'description' => 'Failed sign-in attempt for '.$credentials['email'],
        ]);

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Shared password strength rule (min 8, mixed case, letters, numbers).
     */
    public static function passwordRules(): array
    {
        return ['required', 'confirmed', PasswordRule::min(8)->letters()->mixedCase()->numbers()];
    }

    // ─── Password reset ───────────────────────────────────────────────────

    public function showForgotPassword()
    {
        return Inertia::render('auth/ForgotPassword');
    }

    /**
     * Send the reset link. Always returns the same success message whether
     * or not the email exists — no account enumeration.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        return back()->with('success', 'If an account exists for that email, a password reset link is on its way.');
    }

    public function showResetPassword(Request $request, string $token)
    {
        return Inertia::render('auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    /**
     * Complete the reset. Token validity + expiry (60 min, see
     * config/auth.php) are enforced by the password broker.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => self::passwordRules(),
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect('/login')->with('success', 'Your password has been reset — please sign in.');
        }

        return back()->withErrors(['email' => __($status)]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
        if ($user = $request->user()) {
            ActivityLog::record('logout', ['description' => $user->name.' signed out']);
        }

        Auth::logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Logged out successfully');
    }
}
