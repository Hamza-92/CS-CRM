<?php

namespace App\Http\Controllers;

use App\Jobs\ProvisionTenant;
use App\Models\ApplicationInstance;
use App\Models\TenantOperation;
use App\Services\CounterPos\CounterPosTenantService;
use App\Services\TenantProvisioningWorkflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantProvisioningController extends Controller
{
    public function start(Request $request, ApplicationInstance $applicationInstance): RedirectResponse
    {
        Gate::authorize('update', $applicationInstance);
        $active = $applicationInstance->tenantOperations()
            ->where('type', 'provision')
            ->whereIn('status', ['queued', 'running'])
            ->latest()
            ->first();

        if ($active) {
            return back()->with('success', 'Customer setup is already running.');
        }

        $administrator = $this->administratorData($request);

        $operation = $applicationInstance->tenantOperations()->create([
            'requested_by_id' => $request->user()->id,
            'type' => 'provision',
            'status' => 'queued',
            'idempotency_key' => (string) Str::uuid(),
            'request_payload' => [
                'domain' => parse_url((string) $applicationInstance->deployment_url, PHP_URL_HOST),
                'template_code' => $applicationInstance->provisioning_template_code,
                'admin_name' => $administrator['name'],
                'admin_email' => $administrator['email'],
            ],
            'result' => TenantProvisioningWorkflow::initialResult(),
        ]);

        ProvisionTenant::dispatch($operation->id, null, $administrator);

        return back()->with('success', 'Customer setup queued.');
    }

    public function resume(Request $request, ApplicationInstance $applicationInstance): RedirectResponse
    {
        Gate::authorize('update', $applicationInstance);
        $administrator = $this->administratorData($request);
        $operation = $this->failedRun($applicationInstance);
        $failedStep = collect($operation->result['steps'] ?? [])->firstWhere('status', 'failed');
        $this->markQueued($operation);
        ProvisionTenant::dispatch($operation->id, $failedStep['key'] ?? null, $administrator);

        return back()->with('success', 'Customer setup resumed.');
    }

    public function retryStep(Request $request, ApplicationInstance $applicationInstance): RedirectResponse
    {
        Gate::authorize('update', $applicationInstance);
        $data = $request->validate(['step' => ['required', Rule::in(array_keys(TenantProvisioningWorkflow::STEPS))]]);
        $administrator = in_array($data['step'], ['create_database', 'configure_administrator'], true)
            ? $this->administratorData($request)
            : null;
        $operation = $applicationInstance->tenantOperations()->where('type', 'provision')->latest()->firstOrFail();
        abort_if(in_array($operation->status, ['queued', 'running'], true), 409, 'Customer setup is already running.');

        $this->markQueued($operation);
        ProvisionTenant::dispatch($operation->id, $data['step'], $administrator);

        return back()->with('success', 'Provisioning queued from '.TenantProvisioningWorkflow::STEPS[$data['step']].'.');
    }

    public function administrator(Request $request, ApplicationInstance $applicationInstance, CounterPosTenantService $counterPos): RedirectResponse
    {
        Gate::authorize('update', $applicationInstance);
        abort_unless($applicationInstance->counterpos_tenant_id, 422, 'Complete tenant registration before configuring its administrator.');

        $administrator = $this->administratorData($request);
        $counterPos->configureAdministrator($applicationInstance, $administrator, $request->user());

        return back()->with('success', 'Tenant administrator password updated.');
    }

    /** @return array{name: string, email: string, password: string} */
    private function administratorData(Request $request): array
    {
        $data = $request->validate([
            'admin_name' => ['required', 'string', 'max:191'],
            'admin_email' => ['required', 'email', 'max:192'],
            'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed'],
        ]);

        return [
            'name' => trim($data['admin_name']),
            'email' => strtolower(trim($data['admin_email'])),
            'password' => $data['password'],
        ];
    }

    private function markQueued(TenantOperation $operation): void
    {
        $operation->update([
            'status' => 'queued',
            'error_code' => null,
            'error_message' => null,
            'finished_at' => null,
        ]);
    }

    private function failedRun(ApplicationInstance $applicationInstance): TenantOperation
    {
        return $applicationInstance->tenantOperations()
            ->where('type', 'provision')
            ->where('status', 'failed')
            ->latest()
            ->firstOrFail();
    }
}
