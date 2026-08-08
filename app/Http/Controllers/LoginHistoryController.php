<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LoginHistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Gate::authorize('viewAny', Activity::class);

        $search = $request->string('search')->toString();
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $loginHistory = Activity::query()
            ->with(['user:id,name,email,avatar_path', 'user.roles:id,name'])
            ->where('event', 'auth.login')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('ip_address', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('users/login-history', [
            'loginHistory' => $loginHistory,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }
}
