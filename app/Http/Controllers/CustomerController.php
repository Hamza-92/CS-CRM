<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use App\Services\AssignmentRouter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    private const SORTABLE = ['name', 'business', 'status', 'created_at', 'last_contacted_at'];

    public function index(Request $request): Response
    {
        return $this->listing($request, false);
    }

    public function archived(Request $request): Response
    {
        return $this->listing($request, true);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->can('create', Customer::class), 403);

        return Inertia::render('customers/create', ['owners' => $this->owners()]);
    }

    public function store(StoreCustomerRequest $request, AssignmentRouter $router): RedirectResponse
    {
        $data = $request->validated();
        $data['owner_id'] = $router->forCustomer($data)?->id;
        $customer = Customer::create($data);

        return redirect()->route('customers.show', $customer)->with('success', "Customer {$customer->name} created.");
    }

    public function show(Request $request, Customer $customer): Response
    {
        abort_unless($request->user()->can('view', $customer), 403);
        $customer->load(['owner:id,name,email,avatar_path', 'followUps.owner:id,name,email,avatar_path']);

        $sourceLead = $customer->converted_from_lead_id
            ? Lead::query()->find($customer->converted_from_lead_id, ['id', 'name', 'status', 'converted_at'])
            : null;

        return Inertia::render('customers/show', [
            'customer' => $this->payload($customer),
            'activities' => $customer->activities()->with('user:id,name,avatar_path')->limit(20)->get(),
            'sourceLead' => $sourceLead,
            'followUps' => $customer->followUps->sortByDesc('scheduled_at')->values()->map(fn ($followUp) => [
                'id' => $followUp->id,
                'reason' => $followUp->reason,
                'scheduled_at' => $followUp->scheduled_at?->toISOString(),
                'status' => $followUp->status,
                'status_label' => \Illuminate\Support\Str::headline($followUp->status),
                'is_overdue' => $followUp->isOverdue(),
                'owner' => $followUp->owner ? ['id' => $followUp->owner->id, 'name' => $followUp->owner->name, 'email' => $followUp->owner->email, 'avatar_url' => $followUp->owner->avatar_url] : null,
            ])->all(),
            'can' => [
                'update' => $request->user()->can('update', $customer),
                'create_follow_up' => $request->user()->can('create', \App\Models\FollowUp::class),
                'create_deal' => $request->user()->can('create', \App\Models\Deal::class),
                'archive' => $request->user()->can('delete', $customer),
            ],
        ]);
    }

    public function edit(Request $request, Customer $customer): Response
    {
        abort_unless($request->user()->can('update', $customer), 403);

        return Inertia::render('customers/edit', ['customer' => $this->payload($customer), 'owners' => $this->owners()]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer, ActivityLogger $logger): RedirectResponse
    {
        $oldStatus = $customer->status;
        $customer->update($request->validated());

        if ($oldStatus !== $customer->status) {
            $logger->log('customer.status_changed', $customer, "Customer {$customer->name} status changed", [
                'old' => ['status' => $oldStatus],
                'new' => ['status' => $customer->status],
            ]);
        }

        return redirect()->route('customers.show', $customer)->with('success', "Customer {$customer->name} updated.");
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->can('delete', $customer), 403);
        $customer->delete();

        return redirect()->route('customers.index')->with('success', "Customer {$customer->name} archived.");
    }

    public function restore(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->can('restore', $customer), 403);
        $customer->restore();

        return redirect()->route('customers.archived')->with('success', "Customer {$customer->name} restored.");
    }

    private function listing(Request $request, bool $archived): Response
    {
        abort_unless($request->user()->can('viewAny', Customer::class), 403);

        $sort = $request->string('sort', 'created_at')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'created_at';
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $status = ! $archived && in_array($request->string('status')->toString(), ['active', 'inactive'], true) ? $request->string('status')->toString() : '';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true) ? $request->integer('per_page', 10) : 10;

        $customers = Customer::query()
            ->with('owner:id,name,email,avatar_path')
            ->withCount('leads')
            ->search($request->string('search')->toString())
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($request->filled('owner_id'), fn (Builder $query) => $query->where('owner_id', $request->integer('owner_id')))
            ->when($archived, fn (Builder $query) => $query->onlyTrashed())
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $customers->through(fn (Customer $customer): array => $this->payload($customer));

        return Inertia::render($archived ? 'customers/archived' : 'customers/index', [
            'customers' => $customers,
            'owners' => $this->owners(),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
                'owner_id' => $request->string('owner_id')->toString(),
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'can' => [
                'create' => $request->user()->can('create', Customer::class),
                'update' => $request->user()->can('update', Customer::class),
                'archive' => $request->user()->can('delete', Customer::class),
            ],
        ]);
    }

    private function owners()
    {
        return User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']);
    }

    /** @return array<string, mixed> */
    private function payload(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'business' => $customer->business,
            'phone' => $customer->phone,
            'whatsapp' => $customer->whatsapp,
            'email' => $customer->email,
            'city' => $customer->city,
            'source' => $customer->source,
            'source_label' => $customer->source ? Str::headline($customer->source) : null,
            'status' => $customer->status,
            'owner_id' => $customer->owner_id,
            'owner' => $customer->owner ? ['id' => $customer->owner->id, 'name' => $customer->owner->name, 'email' => $customer->owner->email, 'avatar_url' => $customer->owner->avatar_url] : null,
            'tags' => $customer->tags ?? [],
            'notes' => $customer->notes,
            'last_contacted_at' => $customer->last_contacted_at?->toISOString(),
            'converted_from_lead_id' => $customer->converted_from_lead_id,
            'leads_count' => $customer->leads_count ?? 0,
            'created_at' => $customer->created_at?->toISOString(),
            'updated_at' => $customer->updated_at?->toISOString(),
            'deleted_at' => $customer->deleted_at?->toISOString(),
        ];
    }
}
