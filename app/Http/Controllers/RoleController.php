<?php

namespace App\Http\Controllers;

use App\Enums\Permission as PermissionEnum;
use App\Enums\RoleName;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Permission as PermissionModel;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const SORTABLE = ['name', 'users_count', 'updated_at'];

    public function index(Request $request): Response
    {
        $this->authorizeManage($request);

        $sort = $request->string('sort', 'name')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'name';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $search = $request->string('search')->trim()->toString();

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->withCount('users')
            ->with('permissions:id,name')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sort, $direction)
            ->paginate($request->integer('per_page', 10) && in_array($request->integer('per_page', 10), [10, 25, 50, 100], true) ? $request->integer('per_page', 10) : 10)
            ->withQueryString();

        $roles->through(fn (Role $role): array => $this->rolePayload($role));

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $roles->perPage(),
            ],
            'can' => ['manage' => true],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorizeManage($request);

        return Inertia::render('roles/create', ['permissions' => $this->permissionCatalog()]);
    }

    public function edit(Request $request, Role $role): Response|RedirectResponse
    {
        $this->authorizeManage($request);

        if ($role->name === RoleName::SuperAdmin->value) {
            return redirect()->route('roles.index')->with('error', 'The Super Admin role is protected.');
        }

        $role->load('permissions:id,name');

        return Inertia::render('roles/edit', [
            'role' => $this->rolePayload($role),
            'permissions' => $this->permissionCatalog(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $this->ensurePermissionRecords();
        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions'] ?? []);

        return back()->with('success', "Role {$role->name} created.");
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        if ($role->name === RoleName::SuperAdmin->value) {
            return back()->with('error', 'The Super Admin role is protected.');
        }

        $data = $request->validated();
        $this->ensurePermissionRecords();
        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions'] ?? []);

        return back()->with('success', "Role {$role->name} updated.");
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $this->authorizeManage($request);

        if (in_array($role->name, RoleName::values(), true)) {
            return back()->with('error', 'System roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            return back()->with('error', 'Remove assigned users before deleting this role.');
        }

        $name = $role->name;
        $role->delete();

        return back()->with('success', "Role {$name} deleted.");
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless($request->user()?->can(PermissionEnum::ManageRoles->value), 403);
    }

    private function ensurePermissionRecords(): void
    {
        foreach (PermissionEnum::cases() as $permission) {
            PermissionModel::findOrCreate($permission->value, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /** @return array<int, array{value: string, label: string, group: string}> */
    private function permissionCatalog(): array
    {
        return collect(PermissionEnum::cases())->map(fn (PermissionEnum $permission) => [
            'value' => $permission->value,
            'label' => $permission->label(),
            'group' => Str::headline(Str::before($permission->value, '.')),
        ])->values()->all();
    }

    /** @return array<string, mixed> */
    private function rolePayload(Role $role): array
    {
        $system = in_array($role->name, RoleName::values(), true);
        $isSuperAdmin = $role->name === RoleName::SuperAdmin->value;
        $permissionNames = $role->permissions->pluck('name')->values()->all();

        return [
            'id' => $role->id,
            'name' => $role->name,
            'label' => RoleName::tryFrom($role->name)?->label() ?? Str::headline($role->name),
            'is_system' => $system,
            'is_protected' => $isSuperAdmin,
            'users_count' => $role->users_count ?? $role->users()->count(),
            'permissions_count' => $isSuperAdmin ? count(PermissionEnum::cases()) : count($permissionNames),
            'permission_names' => $isSuperAdmin ? PermissionEnum::values() : $permissionNames,
            'updated_at' => $role->updated_at?->toISOString(),
        ];
    }
}
