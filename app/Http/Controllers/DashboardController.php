<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Activity;
use App\Models\Plan;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('dashboard', [
            'stats' => [
                'products' => $user->can(Permission::ViewProducts->value) ? Product::query()->active()->count() : null,
                'plans' => $user->can(Permission::ViewPlans->value) ? Plan::query()->active()->count() : null,
                'users' => $user->can(Permission::ViewUsers->value) ? User::query()->active()->count() : null,
            ],
            'recentActivity' => $user->can(Permission::ViewActivityLog->value)
                ? Activity::query()->with('user:id,name')->latest('created_at')->limit(10)->get()
                : [],
        ]);
    }
}
