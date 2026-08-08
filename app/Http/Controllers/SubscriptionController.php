<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubscriptionRequest;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Models\ApplicationInstance;
use App\Models\Plan;
use App\Models\Subscription;
use App\Support\Audit\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    private const SORTABLE = ['starts_at', 'ends_at', 'renewal_at', 'status', 'created_at'];

    public function index(Request $request): Response { return $this->listing($request, false); }
    public function archived(Request $request): Response { return $this->listing($request, true); }

    public function create(): Response
    {
        Gate::authorize('create', Subscription::class);
        return Inertia::render('subscriptions/create', $this->options());
    }

    public function store(StoreSubscriptionRequest $request): RedirectResponse
    {
        $data = $this->withDates($request->validated());
        $subscription = Subscription::create($data);
        return redirect()->route('subscriptions.show', $subscription)->with('success', 'Subscription created.');
    }

    public function show(Request $request, Subscription $subscription): Response
    {
        Gate::authorize('view', $subscription);
        $subscription->load(['applicationInstance.customer:id,name,business,email', 'applicationInstance.product:id,name,code,brand_color', 'plan.product:id,name,code', 'applicationInstance.owner:id,name,email,avatar_path']);
        return Inertia::render('subscriptions/show', [
            'subscription' => $this->payload($subscription),
            'activities' => $subscription->activities()->with('user:id,name,avatar_path')->limit(20)->get(),
            'can' => [
                'update' => $request->user()->can('update', $subscription),
                'archive' => $request->user()->can('delete', $subscription),
                'renew' => $request->user()->can('update', $subscription),
            ],
        ]);
    }

    public function edit(Subscription $subscription): Response
    {
        Gate::authorize('update', $subscription);
        return Inertia::render('subscriptions/edit', [...$this->options(), 'subscription' => $this->payload($subscription)]);
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription, ActivityLogger $logger): RedirectResponse
    {
        $before = $subscription->only(['status', 'kind', 'plan_id', 'ends_at', 'renewal_at', 'auto_renew']);
        $subscription->update($this->withDates($request->validated()));
        $after = $subscription->only(array_keys($before));
        if ($before['status'] !== $after['status']) {
            $logger->log('subscription.status_changed', $subscription, 'Subscription status changed', ['old' => ['status' => $before['status']], 'new' => ['status' => $after['status']]]);
        }
        if ($before['plan_id'] !== $after['plan_id']) {
            $logger->log('subscription.plan_changed', $subscription, 'Subscription plan changed', ['old' => ['plan_id' => $before['plan_id']], 'new' => ['plan_id' => $after['plan_id']]]);
        }
        return redirect()->route('subscriptions.show', $subscription)->with('success', 'Subscription updated.');
    }

    public function renew(Subscription $subscription, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $subscription);
        $plan = $subscription->plan()->first(['id', 'duration_days', 'billing_cycle']);
        $base = ($subscription->ends_at && $subscription->ends_at->isFuture()) ? $subscription->ends_at->copy() : today();
        $endsAt = $plan?->duration_days ? $base->copy()->addDays($plan->duration_days) : null;
        $subscription->update(['status' => 'active', 'starts_at' => $base->toDateString(), 'ends_at' => $endsAt?->toDateString(), 'renewal_at' => $endsAt?->toDateString(), 'cancelled_at' => null]);
        $logger->log('subscription.renewed', $subscription, 'Subscription renewed', ['ends_at' => $endsAt?->toDateString()]);
        return back()->with('success', 'Subscription renewed.');
    }

    public function destroy(Subscription $subscription): RedirectResponse
    {
        Gate::authorize('delete', $subscription);
        $subscription->delete();
        return redirect()->route('subscriptions.index')->with('success', 'Subscription archived.');
    }

    public function restore(Subscription $subscription): RedirectResponse
    {
        Gate::authorize('restore', $subscription);
        $subscription->restore();
        return redirect()->route('subscriptions.show', $subscription)->with('success', 'Subscription restored.');
    }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', Subscription::class);
        $requestedSort = $request->string('sort', 'renewal_at')->toString();
        $sort = in_array($requestedSort, self::SORTABLE, true) ? $requestedSort : 'renewal_at';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;
        $query = Subscription::query()->with(['applicationInstance.customer:id,name,business', 'applicationInstance.product:id,name,code,brand_color', 'plan:id,name,code,billing_cycle,price,currency'])->search($request->string('search')->toString());
        $query->when($archived, fn (Builder $q) => $q->onlyTrashed());
        $query->when(! $archived && in_array($request->string('status')->toString(), Subscription::STATUSES, true), fn (Builder $q) => $q->where('status', $request->string('status')->toString()));
        $query->when(! $archived && in_array($request->string('kind')->toString(), Subscription::KINDS, true), fn (Builder $q) => $q->where('kind', $request->string('kind')->toString()));
        $query->when($request->filled('instance_id'), fn (Builder $q) => $q->where('application_instance_id', $request->integer('instance_id')));
        $subscriptions = $query->orderByRaw("CASE WHEN status IN ('trialing','active','past_due') AND renewal_at IS NULL THEN 1 WHEN status IN ('trialing','active','past_due') THEN 0 ELSE 2 END")->orderBy($sort, $direction)->paginate($perPage)->withQueryString();
        $stats = collect(Subscription::STATUSES)->mapWithKeys(fn (string $status) => [$status => Subscription::query()->where('status', $status)->count()]);
        return Inertia::render($archived ? 'subscriptions/archived' : 'subscriptions/index', [
            'subscriptions' => $subscriptions,
            'filters' => ['search' => $request->string('search')->toString(), 'status' => $request->string('status')->toString(), 'kind' => $request->string('kind')->toString(), 'instance_id' => $request->integer('instance_id') ?: null, 'sort' => $sort, 'direction' => $direction, 'per_page' => $perPage],
            'stats' => $archived ? null : $stats,
            'options' => ['instances' => $this->instances()],
        ]);
    }

    private function options(): array
    {
        return ['instances' => $this->instances(), 'plans' => Plan::query()->active()->with('product:id,name,code')->orderBy('name')->get(['id', 'product_id', 'name', 'code', 'billing_cycle', 'duration_days', 'price', 'currency', 'grace_days'])];
    }

    private function instances(): Collection
    {
        return ApplicationInstance::query()->with(['customer:id,name,business', 'product:id,name,code'])->where('status', '!=', 'retired')->orderBy('name')->get(['id', 'name', 'customer_id', 'product_id', 'environment', 'status']);
    }

    private function withDates(array $data): array
    {
        if (empty($data['ends_at']) && ! empty($data['plan_id'])) {
            $duration = Plan::query()->whereKey($data['plan_id'])->value('duration_days');
            if ($duration) $data['ends_at'] = Carbon::parse($data['starts_at'])->addDays((int) $duration)->toDateString();
        }
        if (empty($data['renewal_at']) && ! empty($data['ends_at']) && ($data['auto_renew'] ?? true)) $data['renewal_at'] = $data['ends_at'];
        if (empty($data['grace_ends_at']) && ! empty($data['ends_at']) && ! empty($data['plan_id'])) {
            $grace = (int) Plan::query()->whereKey($data['plan_id'])->value('grace_days');
            $data['grace_ends_at'] = Carbon::parse($data['ends_at'])->addDays($grace)->toDateString();
        }
        return $data;
    }

    private function payload(Subscription $subscription): array
    {
        $remaining = $subscription->daysRemaining();
        return [...$subscription->toArray(), 'kind_label' => Str::headline($subscription->kind), 'status_label' => Str::headline($subscription->status), 'days_remaining' => $remaining, 'is_expired' => $subscription->isExpired(), 'application_instance' => $subscription->applicationInstance, 'plan' => $subscription->plan];
    }
}
