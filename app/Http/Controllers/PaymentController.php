<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Payment;
use App\Models\Subscription;
use App\Support\Audit\ActivityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    private const SORTABLE = ['invoice_number', 'amount', 'status', 'due_at', 'paid_at', 'created_at'];

    public function index(Request $request): Response { return $this->listing($request, false); }
    public function archived(Request $request): Response { return $this->listing($request, true); }

    public function create(): Response
    {
        Gate::authorize('create', Payment::class);
        return Inertia::render('payments/create', ['subscriptions' => $this->subscriptions(), 'currencies' => config('crm.currencies'), 'defaultCurrency' => config('crm.default_currency')]);
    }

    public function store(StorePaymentRequest $request): RedirectResponse
    {
        $payment = Payment::create($this->normalize($request->validated()));
        return redirect()->route('payments.show', $payment)->with('success', "Payment {$payment->invoice_number} created.");
    }

    public function show(Request $request, Payment $payment): Response
    {
        Gate::authorize('view', $payment);
        $payment->load(['subscription.applicationInstance.customer:id,name,business,email', 'subscription.applicationInstance.product:id,name,code,brand_color', 'subscription.plan:id,name,code,billing_cycle,price,currency', 'verifiedBy:id,name,email,avatar_path']);
        return Inertia::render('payments/show', ['payment' => $this->payload($payment), 'activities' => $payment->activities()->with('user:id,name,avatar_path')->limit(20)->get(), 'can' => ['update' => $request->user()->can('update', $payment), 'archive' => $request->user()->can('delete', $payment), 'verify' => $request->user()->can('update', $payment) && ! $payment->verified_at]]);
    }

    public function edit(Payment $payment): Response
    {
        Gate::authorize('update', $payment);
        return Inertia::render('payments/edit', ['payment' => $this->payload($payment), 'subscriptions' => $this->subscriptions(true), 'currencies' => config('crm.currencies')]);
    }

    public function update(UpdatePaymentRequest $request, Payment $payment, ActivityLogger $logger): RedirectResponse
    {
        $before = $payment->only(['status', 'amount', 'paid_at', 'subscription_id']);
        $payment->update($this->normalize($request->validated()));
        $after = $payment->only(array_keys($before));
        if ($before['status'] !== $after['status']) $logger->log('payment.status_changed', $payment, 'Payment status changed', ['old' => ['status' => $before['status']], 'new' => ['status' => $after['status']]]);
        return redirect()->route('payments.show', $payment)->with('success', "Payment {$payment->invoice_number} updated.");
    }

    public function markPaid(Payment $payment, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $payment);
        $payment->load('subscription');
        $payment->update(['status' => 'paid', 'paid_at' => today()->toDateString()]);
        $logger->log('payment.marked_paid', $payment, "Payment {$payment->invoice_number} marked as paid");
        if ($payment->subscription && $payment->subscription->status === 'past_due') {
            $payment->subscription->update(['status' => 'active']);
            $logger->log('subscription.reactivated', $payment->subscription, 'Subscription reactivated after payment', ['payment_id' => $payment->id]);
        }
        return back()->with('success', 'Payment marked as paid.');
    }

    public function verify(Request $request, Payment $payment, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $payment);
        $data = $request->validate(['verification_notes' => ['nullable', 'string', 'max:2000']]);
        $payment->update(['verified_at' => now(), 'verified_by_id' => $request->user()->id, 'verification_notes' => $data['verification_notes'] ?? null]);
        $logger->log('payment.verified', $payment, "Payment {$payment->invoice_number} verified", ['verified_by_id' => $request->user()->id]);
        return back()->with('success', 'Payment verified.');
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        Gate::authorize('delete', $payment);
        $payment->delete();
        return redirect()->route('payments.index')->with('success', "Payment {$payment->invoice_number} archived.");
    }

    public function restore(Payment $payment): RedirectResponse
    {
        Gate::authorize('restore', $payment);
        $payment->restore();
        return redirect()->route('payments.show', $payment)->with('success', 'Payment restored.');
    }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', Payment::class);
        $requestedSort = $request->string('sort', 'due_at')->toString();
        $sort = in_array($requestedSort, self::SORTABLE, true) ? $requestedSort : 'due_at';
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;
        $query = Payment::query()->with(['subscription.applicationInstance.customer:id,name,business', 'subscription.applicationInstance.product:id,name,code,brand_color', 'subscription.plan:id,name,code'])->search($request->string('search')->toString());
        $query->when($archived, fn (Builder $q) => $q->onlyTrashed());
        $query->when(! $archived && in_array($request->string('status')->toString(), Payment::STATUSES, true), fn (Builder $q) => $q->where('status', $request->string('status')->toString()));
        $query->when($request->filled('subscription_id'), fn (Builder $q) => $q->where('subscription_id', $request->integer('subscription_id')));
        $payments = $query->orderByRaw("CASE WHEN status = 'pending' AND due_at < ? THEN 0 WHEN status = 'pending' THEN 1 ELSE 2 END", [today()])->orderBy($sort, $direction)->paginate($perPage)->withQueryString();
        $stats = collect(Payment::STATUSES)->mapWithKeys(fn (string $status) => [$status => Payment::query()->where('status', $status)->count()]);
        $financials = [
            'paid' => (float) Payment::query()->where('status', 'paid')->sum('amount'),
            'outstanding' => (float) Payment::query()->whereIn('status', ['pending', 'partially_paid'])->sum('amount'),
            'at_risk' => (float) Payment::query()->where('status', 'failed')->sum('amount'),
        ];
        return Inertia::render($archived ? 'payments/archived' : 'payments/index', ['payments' => $payments, 'filters' => ['search' => $request->string('search')->toString(), 'status' => $request->string('status')->toString(), 'subscription_id' => $request->integer('subscription_id') ?: null, 'sort' => $sort, 'direction' => $direction, 'per_page' => $perPage], 'stats' => $archived ? null : $stats, 'financials' => $archived ? null : $financials, 'options' => ['subscriptions' => $this->subscriptions()]]);
    }

    private function subscriptions(bool $includeArchived = false): Collection
    {
        $query = Subscription::query()->with(['applicationInstance.customer:id,name,business', 'applicationInstance.product:id,name,code', 'plan:id,name,code,currency']);
        if ($includeArchived) $query->withTrashed();
        return $query->whereIn('status', ['trialing', 'active', 'past_due', 'paused'])->latest('starts_at')->limit(500)->get(['id', 'application_instance_id', 'plan_id', 'status', 'kind']);
    }

    private function normalize(array $data): array
    {
        if (($data['status'] ?? null) === 'paid' && empty($data['paid_at'])) $data['paid_at'] = today()->toDateString();
        if (($data['status'] ?? null) !== 'paid') $data['paid_at'] = $data['paid_at'] ?? null;
        return $data;
    }

    private function payload(Payment $payment): array
    {
        return [...$payment->toArray(), 'status_label' => Str::headline($payment->status), 'method_label' => $payment->method ? Str::headline($payment->method) : null, 'subscription' => $payment->subscription, 'verified_by' => $payment->verifiedBy ? ['id' => $payment->verifiedBy->id, 'name' => $payment->verifiedBy->name, 'email' => $payment->verifiedBy->email, 'avatar_url' => $payment->verifiedBy->avatar_url] : null];
    }
}
