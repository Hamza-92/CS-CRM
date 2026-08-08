<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('profile/edit', [
            'profile' => [
                ...$user->only(['id', 'name', 'email', 'job_title', 'phone']),
                'roles' => $user->getRoleNames()->all(),
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Profile updated.');
    }

    public function updatePassword(UpdatePasswordRequest $request, ActivityLogger $logger): RedirectResponse
    {
        $user = $request->user();

        $user->forceFill(['password' => $request->validated()['password']])->saveQuietly();

        $logger->log('user.password_changed', $user, "{$user->name} changed their password");

        return back()->with('success', 'Password updated.');
    }
}
