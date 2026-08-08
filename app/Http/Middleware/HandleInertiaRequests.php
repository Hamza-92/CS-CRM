<?php

namespace App\Http\Middleware;

use App\Enums\Permission;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'theme' => $request->session()->get('theme', 'light'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'avatar_url' => $user->avatar_path ? url('/storage/'.ltrim($user->avatar_path, '/')) : null,
                    'roles' => $user->getRoleNames()->all(),
                ] : null,
                'can' => $this->abilities($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * @return array<string, bool>
     */
    protected function abilities(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        $abilities = [];

        foreach (Permission::cases() as $permission) {
            $abilities[$permission->value] = $user->can($permission->value);
        }

        return $abilities;
    }
}
