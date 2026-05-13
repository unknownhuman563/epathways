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

            ActivityLog::record('login', ['description' => Auth::user()->name.' signed in']);

            return redirect()->intended(Auth::user()->homeRoute())
                ->with('success', 'Welcome back, '.Auth::user()->name.'!');
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
