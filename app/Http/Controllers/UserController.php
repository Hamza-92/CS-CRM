<?php

namespace App\Http\Controllers;

use App\Enums\RoleName;
use App\Http\Requests\ResetUserPasswordRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    private const SORTABLE = ['name', 'email', 'is_active', 'last_login_at', 'created_at'];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $sort = $request->string('sort', 'name')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'name';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $status = $request->string('status')->toString();
        $status = in_array($status, ['active', 'inactive'], true) ? $status : '';

        $users = User::query()
            ->with('roles:id,name')
            ->search($request->string('search')->toString())
            ->when(
                $status !== '',
                fn ($query) => $query->where('is_active', $status === 'active'),
            )
            ->when(
                $request->filled('role'),
                fn ($query) => $query->whereHas('roles', fn ($q) => $q->where('name', $request->string('role')->toString())),
            )
            ->orderBy($sort, $direction)
            ->paginate(in_array($request->integer('per_page', 10), [10, 25, 50, 100], true) ? $request->integer('per_page', 10) : 10)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $this->roleOptions($request),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
                'role' => $request->string('role')->toString(),
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => in_array($request->integer('per_page', 10), [10, 25, 50, 100], true) ? $request->integer('per_page', 10) : 10,
            ],
            'can' => [
                'create' => $request->user()->can('create', User::class),
                'manage' => $request->user()->can('create', User::class),
                'login_history' => $request->user()->can('viewAny', \App\Models\Activity::class),
            ],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $role = $data['role'];
        unset($data['role']);

        $user = User::create($data);
        $user->syncRoles([$role]);

        return back()->with('success', "User {$user->name} created.");
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $role = $data['role'];
        unset($data['role']);

        $user->update($data);

        if ($request->user()->can('assignRoles', $user)) {
            $user->syncRoles([$role]);
        }

        return back()->with('success', "User {$user->name} updated.");
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user, ActivityLogger $logger): RedirectResponse
    {
        $user->forceFill(['password' => $request->validated()['password']])->saveQuietly();

        $logger->log('user.password_reset', $user, "Password reset for {$user->name}");

        return back()->with('success', "Password reset for {$user->name}.");
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return back()->with('error', 'You cannot change your own status.');
        }

        if ($user->hasRole(RoleName::SuperAdmin->value) && ! $request->user()?->hasRole(RoleName::SuperAdmin->value)) {
            return back()->with('error', 'The Super Admin account is protected.');
        }

        Gate::authorize('toggleStatus', $user);

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', "{$user->name} is now ".($user->is_active ? 'active' : 'inactive').'.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->hasRole(RoleName::SuperAdmin->value) && ! $request->user()?->hasRole(RoleName::SuperAdmin->value)) {
            return back()->with('error', 'The Super Admin account is protected.');
        }

        Gate::authorize('delete', $user);

        $user->delete();

        return back()->with('success', "User {$user->name} deleted.");
    }

    /**
     * @return array<int, array{value: string, label: string, description: string}>
     */
    protected function roleOptions(Request $request): array
    {
        $roles = Role::query()->where('guard_name', 'web')->orderBy('name')->get(['name']);

        if (! $request->user()->hasRole(RoleName::SuperAdmin->value)) {
            $roles = $roles->reject(fn (Role $role) => $role->name === RoleName::SuperAdmin->value);
        }

        return $roles->map(fn (Role $role) => [
            'value' => $role->name,
            'label' => RoleName::tryFrom($role->name)?->label() ?? Str::headline($role->name),
            'description' => RoleName::tryFrom($role->name)?->description() ?? '',
        ])->values()->all();
    }
}
