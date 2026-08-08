<?php

namespace App\Http\Controllers;

use App\Enums\BillingCycle;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Models\Plan;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(Product $product): RedirectResponse
    {
        return redirect()->route('products.show', $product);
    }

    public function create(Product $product): Response
    {
        Gate::authorize('create', Plan::class);

        return Inertia::render('plans/create', [
            'product' => $product->only(['id', 'name', 'code', 'default_trial_days']),
            'billingCycles' => BillingCycle::options(),
            'currencies' => config('crm.currencies'),
            'defaults' => [
                'currency' => config('crm.default_currency'),
                'grace_days' => config('crm.default_grace_days'),
            ],
        ]);
    }

    public function store(StorePlanRequest $request, Product $product): RedirectResponse
    {
        $plan = $product->plans()->create($request->validated());

        return redirect()
            ->route('products.show', $product)
            ->with('success', "Plan {$plan->name} created.");
    }

    public function edit(Plan $plan): Response
    {
        Gate::authorize('update', $plan);

        $plan->load('product:id,name,code,default_trial_days');

        return Inertia::render('plans/edit', [
            'plan' => $plan,
            'product' => $plan->product->only(['id', 'name', 'code', 'default_trial_days']),
            'billingCycles' => BillingCycle::options(),
            'currencies' => config('crm.currencies'),
        ]);
    }

    public function update(UpdatePlanRequest $request, Plan $plan): RedirectResponse
    {
        $plan->update($request->validated());

        return redirect()
            ->route('products.show', $plan->product_id)
            ->with('success', "Plan {$plan->name} updated.");
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        Gate::authorize('delete', $plan);

        $productId = $plan->product_id;
        $plan->delete();

        return redirect()
            ->route('products.show', $productId)
            ->with('success', "Plan {$plan->name} archived.");
    }
}
