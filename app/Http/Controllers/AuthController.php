<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
