<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicationInstanceRequest;
use App\Http\Requests\UpdateApplicationInstanceRequest;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationInstanceController extends Controller
{
    private const SORTABLE = ['name', 'environment', 'status', 'deployed_at', 'created_at'];

    public function index(Request $request): Response { return $this->listing($request, false); }
    public function archived(Request $request): Response { return $this->listing($request, true); }

    public function create(): Response
    {
        Gate::authorize('create', ApplicationInstance::class);
        return Inertia::render('application-instances/create', $this->options());
    }

    public function store(StoreApplicationInstanceRequest $request): RedirectResponse
    {
        $instance = ApplicationInstance::create($request->validated());
        return redirect()->route('instances.show', $instance)->with('success', "Instance {$instance->name} created.");
    }

    public function show(Request $request, ApplicationInstance $applicationInstance): Response
    {
        Gate::authorize('view', $applicationInstance);
        $applicationInstance->load([
            'customer:id,name,business,email', 'product:id,name,code,brand_color', 'owner:id,name,email,avatar_path',
            'subscriptions' => fn ($query) => $query->with('plan:id,name,code')->latest('starts_at')->limit(6),
            'followUps' => fn ($query) => $query->with('owner:id,name,email,avatar_path')->latest('scheduled_at')->limit(8),
        ]);

        return Inertia::render('application-instances/show', [
            'instance' => [...$this->payload($applicationInstance), 'subscriptions' => $applicationInstance->subscriptions->map(fn ($subscription) => [...$subscription->toArray(), 'plan' => $subscription->plan, 'status_label' => Str::headline($subscription->status)])->values()->all()],
            'activities' => $applicationInstance->activities()->with('user:id,name,avatar_path')->limit(20)->get(),
            'can' => [
                'update' => $request->user()->can('update', $applicationInstance),
                'archive' => $request->user()->can('delete', $applicationInstance),
                'create_follow_up' => $request->user()->can('create', \App\Models\FollowUp::class),
            ],
        ]);
    }

    public function edit(ApplicationInstance $applicationInstance): Response
    {
        Gate::authorize('update', $applicationInstance);
        return Inertia::render('application-instances/edit', [...$this->options(), 'instance' => $this->payload($applicationInstance)]);
    }

    public function update(UpdateApplicationInstanceRequest $request, ApplicationInstance $applicationInstance, ActivityLogger $logger): RedirectResponse
    {
        $before = $applicationInstance->only(['status', 'environment', 'deployment_url', 'version']);
        $applicationInstance->update($request->validated());
        $after = $applicationInstance->only(array_keys($before));

        if ($before['status'] !== $after['status']) {
            $logger->log('instance.status_changed', $applicationInstance, "Instance {$applicationInstance->name} status changed", ['old' => ['status' => $before['status']], 'new' => ['status' => $after['status']]]);
        }
        if ($before['environment'] !== $after['environment']) {
            $logger->log('instance.environment_changed', $applicationInstance, "Instance {$applicationInstance->name} environment changed", ['old' => ['environment' => $before['environment']], 'new' => ['environment' => $after['environment']]]);
        }
        return redirect()->route('instances.show', $applicationInstance)->with('success', "Instance {$applicationInstance->name} updated.");
    }

    public function destroy(ApplicationInstance $applicationInstance): RedirectResponse
    {
        Gate::authorize('delete', $applicationInstance);
        $applicationInstance->delete();
        return redirect()->route('instances.index')->with('success', "Instance {$applicationInstance->name} archived.");
    }

    public function restore(ApplicationInstance $applicationInstance): RedirectResponse
    {
        Gate::authorize('restore', $applicationInstance);
        $applicationInstance->restore();
        return redirect()->route('instances.show', $applicationInstance)->with('success', "Instance {$applicationInstance->name} restored.");
    }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', ApplicationInstance::class);
        $requestedSort = $request->string('sort', 'created_at')->toString();
        $sort = in_array($requestedSort, self::SORTABLE, true) ? $requestedSort : 'created_at';
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;
        $query = ApplicationInstance::query()->with(['customer:id,name,business', 'product:id,name,code,brand_color', 'owner:id,name,avatar_path'])->withCount('followUps')->search($request->string('search')->toString());
        $query->when($archived, fn (Builder $q) => $q->onlyTrashed());
        $query->when(! $archived && in_array($request->string('status')->toString(), ApplicationInstance::STATUSES, true), fn (Builder $q) => $q->where('status', $request->string('status')->toString()));
        $query->when(in_array($request->string('environment')->toString(), ApplicationInstance::ENVIRONMENTS, true), fn (Builder $q) => $q->where('environment', $request->string('environment')->toString()));
        $query->when($request->filled('customer_id'), fn (Builder $q) => $q->where('customer_id', $request->integer('customer_id')));
        $query->when($request->filled('product_id'), fn (Builder $q) => $q->where('product_id', $request->integer('product_id')));

        return Inertia::render($archived ? 'application-instances/archived' : 'application-instances/index', [
            'instances' => $query->orderBy($sort, $direction)->paginate($perPage)->withQueryString(),
            'filters' => ['search' => $request->string('search')->toString(), 'status' => $request->string('status')->toString(), 'environment' => $request->string('environment')->toString(), 'customer_id' => $request->integer('customer_id') ?: null, 'product_id' => $request->integer('product_id') ?: null, 'sort' => $sort, 'direction' => $direction, 'per_page' => $perPage],
            'stats' => $archived ? null : collect(ApplicationInstance::STATUSES)->mapWithKeys(fn (string $status) => [$status => ApplicationInstance::query()->where('status', $status)->count()]),
            'options' => ['customers' => $this->customers(), 'products' => $this->products()],
        ]);
    }

    private function options(): array { return ['customers' => $this->customers(), 'products' => $this->products(), 'owners' => User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path'])]; }
    private function customers(): Collection { return Customer::query()->orderBy('name')->get(['id', 'name', 'business', 'email']); }
    private function products(): Collection { return Product::query()->active()->orderBy('name')->get(['id', 'name', 'code', 'brand_color']); }
    private function payload(ApplicationInstance $instance): array
    {
        return [...$instance->toArray(), 'environment_label' => Str::headline($instance->environment), 'status_label' => Str::headline($instance->status), 'customer' => $instance->customer, 'product' => $instance->product, 'owner' => $instance->owner ? [...$instance->owner->toArray(), 'avatar_url' => $instance->owner->avatar_url] : null, 'follow_ups_count' => $instance->follow_ups_count ?? $instance->followUps()->count()];
    }
}
