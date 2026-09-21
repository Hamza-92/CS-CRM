<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerOnboardingRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Deal;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\WorkTask;
use App\Services\AssignmentRouter;
use App\Support\Audit\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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

        return Inertia::render('customers/create', [
            'owners' => $this->owners(),
            'products' => $this->onboardingProducts(),
            'currencies' => config('crm.currencies'),
            'defaultCurrency' => config('crm.default_currency'),
            'defaults' => [
                'starts_at' => today()->toDateString(),
                'invoice_number' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(4)),
            ],
            'can' => [
                'create_instance' => $request->user()->can('create', ApplicationInstance::class),
                'create_subscription' => $request->user()->can('create', Subscription::class),
                'create_payment' => $request->user()->can('create', Payment::class),
            ],
        ]);
    }

    public function store(StoreCustomerOnboardingRequest $request, AssignmentRouter $router): RedirectResponse
    {
        $data = $request->validated();
        $applicationEnabled = (bool) data_get($data, 'application.enabled', false);
        $subscriptionEnabled = (bool) data_get($data, 'subscription.enabled', false);
        $paymentEnabled = (bool) data_get($data, 'payment.enabled', false);

        abort_if($applicationEnabled && ! $request->user()->can('create', ApplicationInstance::class), 403);
        abort_if($subscriptionEnabled && ! $request->user()->can('create', Subscription::class), 403);
        abort_if($paymentEnabled && ! $request->user()->can('create', Payment::class), 403);

        if ($subscriptionEnabled && ! $applicationEnabled) {
            throw ValidationException::withMessages(['subscription.enabled' => 'A subscription requires an application.']);
        }
        if ($paymentEnabled && ! $subscriptionEnabled) {
            throw ValidationException::withMessages(['payment.enabled' => 'A payment requires a subscription.']);
        }

        $product = $applicationEnabled
            ? Product::query()->active()->findOrFail((int) data_get($data, 'application.product_id'))
            : null;
        $plan = $subscriptionEnabled
            ? Plan::query()->active()->findOrFail((int) data_get($data, 'subscription.plan_id'))
            : null;

        if ($plan && $product && $plan->product_id !== $product->id) {
            throw ValidationException::withMessages(['subscription.plan_id' => 'Select a plan that belongs to the chosen product.']);
        }

        $customer = DB::transaction(function () use ($data, $router, $product, $plan, $applicationEnabled, $subscriptionEnabled, $paymentEnabled): Customer {
            $customerData = Arr::except($data, ['contacts', 'application', 'subscription', 'payment']);
            $customerData['owner_id'] = $router->forCustomer($customerData)?->id;
            $customer = Customer::query()->create($customerData);

            $contacts = collect($data['contacts'] ?? [])->filter(fn (array $contact) => filled($contact['name'] ?? null))->values();
            $hasPrimary = $contacts->contains(fn (array $contact) => (bool) ($contact['is_primary'] ?? false));
            foreach ($contacts as $index => $contact) {
                $customer->contacts()->create([
                    ...Arr::only($contact, ['name', 'job_title', 'email', 'phone', 'whatsapp', 'notes']),
                    'is_primary' => $hasPrimary ? (bool) ($contact['is_primary'] ?? false) : $index === 0,
                ]);
            }

            if (! $applicationEnabled || ! $product) {
                return $customer;
            }

            $applicationData = $data['application'];
            $domain = strtolower(trim((string) ($applicationData['domain'] ?? '')));
            $instance = $customer->instances()->create([
                'product_id' => $product->id,
                'owner_id' => $customer->owner_id,
                'name' => filled($applicationData['name'] ?? null)
                    ? $applicationData['name']
                    : (($customer->business ?: $customer->name).' CounterPOS'),
                'environment' => $applicationData['environment'],
                'status' => $applicationData['status'],
                'deployment_url' => $domain !== '' ? 'https://'.$domain : null,
                'server_name' => $applicationData['server_name'] ?? null,
                'version' => $applicationData['version'] ?? null,
                'provisioning_template_code' => $applicationData['provisioning_template_code'] ?? null,
                'provisioning_template_version' => filled($applicationData['provisioning_template_code'] ?? null) ? 1 : null,
                'notes' => $applicationData['notes'] ?? null,
            ]);

            if (! $subscriptionEnabled || ! $plan) {
                return $customer;
            }

            $subscriptionData = $data['subscription'];
            $startsAt = Carbon::parse($subscriptionData['starts_at']);
            $duration = $plan->duration_days ?? $plan->billing_cycle->defaultDurationDays();
            $endsAt = filled($subscriptionData['ends_at'] ?? null)
                ? Carbon::parse($subscriptionData['ends_at'])
                : ($duration ? $startsAt->copy()->addDays((int) $duration) : null);
            $autoRenew = (bool) ($subscriptionData['auto_renew'] ?? true);
            $renewalAt = filled($subscriptionData['renewal_at'] ?? null)
                ? Carbon::parse($subscriptionData['renewal_at'])
                : ($autoRenew ? $endsAt?->copy() : null);
            $graceEndsAt = filled($subscriptionData['grace_ends_at'] ?? null)
                ? Carbon::parse($subscriptionData['grace_ends_at'])
                : ($endsAt ? $endsAt->copy()->addDays((int) $plan->grace_days) : null);

            $subscription = $instance->subscriptions()->create([
                'plan_id' => $plan->id,
                'kind' => $subscriptionData['kind'],
                'status' => $subscriptionData['status'],
                'starts_at' => $startsAt->toDateString(),
                'ends_at' => $endsAt?->toDateString(),
                'renewal_at' => $renewalAt?->toDateString(),
                'grace_ends_at' => $graceEndsAt?->toDateString(),
                'auto_renew' => $autoRenew,
                'external_reference' => $subscriptionData['external_reference'] ?? null,
                'notes' => $subscriptionData['notes'] ?? null,
            ]);

            if ($paymentEnabled) {
                $paymentData = $data['payment'];
                $subscription->payments()->create([
                    ...Arr::only($paymentData, ['invoice_number', 'amount', 'currency', 'status', 'method', 'due_at', 'paid_at', 'reference', 'notes']),
                    'paid_at' => $paymentData['status'] === 'paid'
                        ? ($paymentData['paid_at'] ?: today()->toDateString())
                        : ($paymentData['paid_at'] ?? null),
                ]);
            }

            return $customer;
        });

        return redirect()->route('customers.show', $customer)->with('success', "Customer {$customer->name} and onboarding records created.");
    }

    public function show(Request $request, Customer $customer): Response
    {
        abort_unless($request->user()->can('view', $customer), 403);
        $customer->load([
            'owner:id,name,email,avatar_path',
            'contacts' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('name'),
            'leads:id,customer_id,name,business,status,email,updated_at',
            'deals:id,customer_id,title,amount,currency,stage_id,updated_at', 'deals.stage:id,name,slug,color',
            'instances:id,customer_id,product_id,name,environment,status,deployment_url,server_name,version,last_checked_at,counterpos_tenant_id,counterpos_status,counterpos_schema_version,provisioning_template_code,provisioning_template_version,last_synced_at',
            'instances.product:id,name,code,brand_color',
            'instances.tenantOperations' => fn ($query) => $query->where('type', 'provision')->latest()->limit(1),
            'instances.subscriptions:id,application_instance_id,plan_id,kind,status,starts_at,ends_at,renewal_at',
            'instances.subscriptions.plan:id,name,code',
            'instances.subscriptions.payments:id,subscription_id,invoice_number,amount,currency,status,due_at,paid_at,verified_at',
            'supportTickets:id,customer_id,ticket_number,subject,status,priority,updated_at',
            'tasks:id,customer_id,task_number,title,status,priority,due_at,updated_at',
            'followUps.owner:id,name,email,avatar_path',
        ]);

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
                'status_label' => Str::headline($followUp->status),
                'is_overdue' => $followUp->isOverdue(),
                'owner' => $followUp->owner ? ['id' => $followUp->owner->id, 'name' => $followUp->owner->name, 'email' => $followUp->owner->email, 'avatar_url' => $followUp->owner->avatar_url] : null,
            ])->all(),
            'can' => [
                'update' => $request->user()->can('update', $customer),
                'create_follow_up' => $request->user()->can('create', FollowUp::class),
                'create_deal' => $request->user()->can('create', Deal::class),
                'archive' => $request->user()->can('delete', $customer),
                'manage_contacts' => $request->user()->can('update', $customer),
                'create_instance' => $request->user()->can('create', ApplicationInstance::class),
                'create_subscription' => $request->user()->can('create', Subscription::class),
                'create_payment' => $request->user()->can('create', Payment::class),
                'create_ticket' => $request->user()->can('create', SupportTicket::class),
                'create_task' => $request->user()->can('create', WorkTask::class),
                'provision_instances' => $customer->instances->contains(fn ($instance) => $request->user()->can('update', $instance)),
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

    private function onboardingProducts(): array
    {
        return Product::query()
            ->active()
            ->with(['plans' => fn ($query) => $query->active()->orderBy('sort_order')->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'brand_color', 'default_trial_days'])
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'brand_color' => $product->brand_color,
                'default_trial_days' => $product->default_trial_days,
                'plans' => $product->plans->map(fn (Plan $plan) => [
                    'id' => $plan->id,
                    'product_id' => $plan->product_id,
                    'name' => $plan->name,
                    'code' => $plan->code,
                    'billing_cycle' => $plan->billing_cycle->value,
                    'duration_days' => $plan->duration_days,
                    'price' => $plan->price,
                    'currency' => $plan->currency,
                    'grace_days' => $plan->grace_days,
                ])->values()->all(),
            ])
            ->values()
            ->all();
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
            'contacts' => $customer->relationLoaded('contacts') ? $customer->contacts->map(fn (CustomerContact $contact) => [
                'id' => $contact->id, 'name' => $contact->name, 'job_title' => $contact->job_title,
                'email' => $contact->email, 'phone' => $contact->phone, 'whatsapp' => $contact->whatsapp,
                'is_primary' => $contact->is_primary, 'notes' => $contact->notes,
            ])->values()->all() : [],
            'leads' => $customer->relationLoaded('leads') ? $customer->leads->map(fn (Lead $lead) => ['id' => $lead->id, 'name' => $lead->name, 'business' => $lead->business, 'status' => $lead->status, 'email' => $lead->email, 'updated_at' => $lead->updated_at?->toISOString()])->values()->all() : [],
            'deals' => $customer->relationLoaded('deals') ? $customer->deals->map(fn ($deal) => ['id' => $deal->id, 'title' => $deal->title, 'amount' => $deal->amount, 'currency' => $deal->currency, 'stage' => $deal->stage ? ['name' => $deal->stage->name, 'color' => $deal->stage->color] : null])->values()->all() : [],
            'instances' => $customer->relationLoaded('instances') ? $customer->instances->map(fn ($instance) => [
                'id' => $instance->id,
                'name' => $instance->name,
                'environment' => $instance->environment,
                'status' => $instance->status,
                'deployment_url' => $instance->deployment_url,
                'server_name' => $instance->server_name,
                'version' => $instance->version,
                'last_checked_at' => $instance->last_checked_at?->toISOString(),
                'counterpos_tenant_id' => $instance->counterpos_tenant_id,
                'counterpos_status' => $instance->counterpos_status,
                'counterpos_schema_version' => $instance->counterpos_schema_version,
                'provisioning_template_code' => $instance->provisioning_template_code,
                'provisioning_template_version' => $instance->provisioning_template_version,
                'last_synced_at' => $instance->last_synced_at?->toISOString(),
                'provisioning' => ($run = $instance->tenantOperations->firstWhere('type', 'provision')) ? [
                    'id' => $run->id,
                    'status' => $run->status,
                    'steps' => $run->result['steps'] ?? [],
                    'error_message' => $run->error_message,
                    'started_at' => $run->started_at?->toISOString(),
                    'finished_at' => $run->finished_at?->toISOString(),
                ] : null,
                'product' => $instance->product ? [
                    'id' => $instance->product->id,
                    'name' => $instance->product->name,
                    'code' => $instance->product->code,
                    'brand_color' => $instance->product->brand_color,
                ] : null,
                'subscriptions' => $instance->subscriptions->map(fn ($subscription) => [
                    'id' => $subscription->id,
                    'kind' => $subscription->kind,
                    'status' => $subscription->status,
                    'starts_at' => $subscription->starts_at?->toISOString(),
                    'ends_at' => $subscription->ends_at?->toISOString(),
                    'renewal_at' => $subscription->renewal_at?->toISOString(),
                    'plan' => $subscription->plan ? ['name' => $subscription->plan->name, 'code' => $subscription->plan->code] : null,
                    'payments' => $subscription->payments->map(fn ($payment) => [
                        'id' => $payment->id,
                        'invoice_number' => $payment->invoice_number,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'status' => $payment->status,
                        'due_at' => $payment->due_at?->toISOString(),
                        'paid_at' => $payment->paid_at?->toISOString(),
                        'verified_at' => $payment->verified_at?->toISOString(),
                    ])->values()->all(),
                ])->values()->all(),
            ])->values()->all() : [],
            'support_tickets' => $customer->relationLoaded('supportTickets') ? $customer->supportTickets->map(fn ($ticket) => ['id' => $ticket->id, 'ticket_number' => $ticket->ticket_number, 'subject' => $ticket->subject, 'status' => $ticket->status, 'priority' => $ticket->priority])->values()->all() : [],
            'tasks' => $customer->relationLoaded('tasks') ? $customer->tasks->map(fn ($task) => ['id' => $task->id, 'task_number' => $task->task_number, 'title' => $task->title, 'status' => $task->status, 'priority' => $task->priority, 'due_at' => $task->due_at?->toISOString()])->values()->all() : [],
        ];
    }
}
