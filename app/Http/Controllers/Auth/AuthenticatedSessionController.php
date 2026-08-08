<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login', [
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request, ActivityLogger $logger): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->saveQuietly();

        $logger->log('auth.login', $user, "{$user->name} signed in");

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request, ActivityLogger $logger): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            $logger->log('auth.logout', $user, "{$user->name} signed out");
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
