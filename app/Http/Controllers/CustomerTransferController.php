<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerTransferRequest;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Services\CounterPos\CounterPosClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

final class CustomerTransferController extends Controller
{
    public function index(Request $request, CounterPosClient $counterPos): Response
    {
        abort_unless($request->user()->can('viewAny', Customer::class), 403);
        $page = max(1, $request->integer('page', 1));
        $search = substr(trim($request->string('search')->toString()), 0, 100);
        $error = null;
        try {
            $response = $counterPos->tenants($page, 25, $search);
            $tenants = $response['data'] ?? [];
            $meta = $response['meta'] ?? [];
        } catch (Throwable $exception) {
            report($exception);
            $tenants = [];
            $meta = ['current_page' => 1, 'last_page' => 1, 'total' => 0];
            $error = 'CounterPOS tenant list is unavailable. Check the signed API connection.';
        }

        $linked = ApplicationInstance::query()->withTrashed()
            ->whereIn('counterpos_tenant_id', collect($tenants)->pluck('id')->filter())
            ->get(['id', 'customer_id', 'counterpos_tenant_id'])
            ->keyBy('counterpos_tenant_id');

        return Inertia::render('customer-transfers/index', [
            'tenants' => collect($tenants)->map(function (array $tenant) use ($linked): array {
                $instance = $linked->get($tenant['id'] ?? '');

                return [...$tenant, 'local_instance_id' => $instance?->id, 'local_customer_id' => $instance?->customer_id];
            })->values()->all(),
            'meta' => $meta,
            'filters' => ['search' => $search],
            'error' => $error,
            'canTransfer' => $this->canTransfer($request),
        ]);
    }

    public function create(Request $request, string $tenantId, CounterPosClient $counterPos): Response|RedirectResponse
    {
        abort_unless($this->canTransfer($request), 403);
        abort_unless(Str::isUuid($tenantId), 404);
        $tenant = $counterPos->tenant($tenantId)['data'] ?? [];
        abort_if(($tenant['crm_application_instance_id'] ?? null) !== null, 409, 'This tenant is already linked to a CRM instance.');
        abort_if(ApplicationInstance::withTrashed()->where('counterpos_tenant_id', $tenantId)->exists(), 409, 'This tenant already has a CRM transfer record.');

        return Inertia::render('customer-transfers/create', [
            'tenant' => $tenant,
            'products' => Product::query()->active()->with(['plans' => fn ($query) => $query->active()])->orderBy('name')->get(['id', 'name', 'code']),
            'existingCustomers' => Customer::query()->orderBy('name')->get(['id', 'name', 'business', 'email', 'status']),
        ]);
    }

    public function store(StoreCustomerTransferRequest $request, CounterPosClient $counterPos): RedirectResponse
    {
        $data = $request->validated();
        $tenantId = $data['tenant_id'];
        $tenant = $counterPos->tenant($tenantId)['data'] ?? [];
        abort_if(($tenant['crm_application_instance_id'] ?? null) !== null, 409, 'This tenant is already linked to a CRM instance.');
        abort_if(ApplicationInstance::withTrashed()->where('counterpos_tenant_id', $tenantId)->exists(), 409, 'This tenant already has a CRM transfer record.');

        $plan = Plan::query()->active()->findOrFail($data['plan_id']);
        abort_unless($plan->product_id === (int) $data['product_id'], 422, 'Plan must belong to the selected product.');
        $existingCustomer = filled($data['existing_customer_id'] ?? null)
            ? Customer::query()->findOrFail($data['existing_customer_id'])
            : null;
        if ($existingCustomer) {
            abort_unless($request->user()->can('update', $existingCustomer), 403);
            if ($data['customer_status'] !== $existingCustomer->status) {
                throw ValidationException::withMessages(['customer_status' => 'Edit the existing customer status from its CRM page before transfer.']);
            }
        }

        [$customer, $instance] = DB::transaction(function () use ($data, $tenant, $tenantId, $plan, $existingCustomer): array {
            $customerData = [
                'name' => $data['name'],
                'business' => $data['business'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'status' => $data['customer_status'],
            ];
            if ($existingCustomer) {
                $customer = $existingCustomer;
                $customer->update(\Illuminate\Support\Arr::except($customerData, ['status']));
            } else {
                $customer = Customer::query()->create($customerData + ['source' => 'counterpos_transfer']);
            }
            $instance = $customer->instances()->create([
                'product_id' => $data['product_id'],
                'name' => $data['instance_name'],
                'environment' => $data['environment'],
                'status' => $data['instance_status'],
                'deployment_url' => $tenant['url'] ?? null,
                'counterpos_tenant_id' => $tenantId,
                'counterpos_status' => $tenant['status'] ?? null,
                'last_synced_at' => now(),
            ]);
            $instance->subscriptions()->create([
                'plan_id' => $plan->id,
                'kind' => $plan->isTrial() ? 'trial' : 'subscription',
                'status' => $data['subscription_status'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'renewal_at' => $data['auto_renew'] ? $data['ends_at'] : null,
                'grace_ends_at' => $plan->grace_days > 0 ? \Carbon\Carbon::parse($data['ends_at'])->addDays($plan->grace_days)->toDateString() : null,
                'auto_renew' => $data['auto_renew'],
                'notes' => 'Transferred from existing CounterPOS tenant '.$tenantId.'.',
            ]);

            return [$customer, $instance];
        });

        try {
            $counterPos->linkTenant($tenantId, $instance->id, (string) Str::uuid());
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->route('customers.show', $customer)
                ->with('error', 'CRM records were saved, but CounterPOS linking failed. Retry the link from the transfer list before changing this subscription.');
        }

        return redirect()->route('customers.show', $customer)->with('success', 'Existing CounterPOS customer transferred to CRM.');
    }

    public function retryLink(Request $request, ApplicationInstance $applicationInstance, CounterPosClient $counterPos): RedirectResponse
    {
        abort_unless($request->user()->can('update', $applicationInstance), 403);
        abort_unless(Str::isUuid((string) $applicationInstance->counterpos_tenant_id), 422);
        $counterPos->linkTenant($applicationInstance->counterpos_tenant_id, $applicationInstance->id, (string) Str::uuid());

        return back()->with('success', 'CounterPOS tenant linked to this CRM instance.');
    }

    private function canTransfer(Request $request): bool
    {
        return $request->user()->can('create', Customer::class)
            && $request->user()->can('create', ApplicationInstance::class)
            && $request->user()->can('create', Subscription::class);
    }
}
