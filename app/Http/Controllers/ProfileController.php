<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                'avatar_url' => $user->avatar_path ? url('/storage/'.ltrim($user->avatar_path, '/')) : null,
                'roles' => $user->getRoleNames()->all(),
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->safe()->only(['name', 'email', 'job_title', 'phone']);

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar') && $user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $data['avatar_path'] = null;
        }

        $user->update($data);

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
