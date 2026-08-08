<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFollowUpRequest;
use App\Http\Requests\UpdateFollowUpRequest;
use App\Models\Customer;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\Product;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FollowUpController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->can('viewAny', FollowUp::class), 403);

        $view = in_array($request->string('view')->toString(), ['today', 'overdue'], true) ? $request->string('view')->toString() : '';
        $status = in_array($request->string('status')->toString(), FollowUp::STATUSES, true) ? $request->string('status')->toString() : '';
        $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;

        $query = FollowUp::query()
            ->with(['lead:id,name,business,email', 'customer:id,name,business,email', 'owner:id,name,email,avatar_path'])
            ->search($request->string('search')->toString())
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($request->filled('owner_id'), fn (Builder $query) => $query->where('owner_id', $request->integer('owner_id')))
            ->when($view === 'today', fn (Builder $query) => $query->whereBetween('scheduled_at', [now()->startOfDay(), now()->endOfDay()])->whereNotIn('status', ['completed', 'cancelled']))
            ->when($view === 'overdue', fn (Builder $query) => $query->overdue())
            ->orderByRaw("CASE WHEN status IN ('pending', 'rescheduled') AND scheduled_at < ? THEN 0 WHEN status IN ('pending', 'rescheduled') THEN 1 ELSE 2 END", [now()])
            ->orderBy('scheduled_at')
            ->paginate($perPage)
            ->withQueryString();

        $query->through(fn (FollowUp $followUp): array => $this->payload($followUp));

        return Inertia::render('follow-ups/index', [
            'followUps' => $query,
            'owners' => $this->owners(),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
                'owner_id' => $request->string('owner_id')->toString(),
                'view' => $view,
                'per_page' => $perPage,
            ],
            'summary' => [
                'today' => FollowUp::query()->whereBetween('scheduled_at', [now()->startOfDay(), now()->endOfDay()])->whereNotIn('status', ['completed', 'cancelled'])->count(),
                'overdue' => FollowUp::query()->overdue()->count(),
                'pending' => FollowUp::query()->whereIn('status', ['pending', 'rescheduled'])->count(),
            ],
            'can' => [
                'create' => $request->user()->can('create', FollowUp::class),
                'update' => $request->user()->can('update', FollowUp::class),
                'delete' => $request->user()->can('delete', FollowUp::class),
                'complete' => $request->user()->can('complete', FollowUp::class),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->can('create', FollowUp::class), 403);

        return Inertia::render('follow-ups/create', $this->formOptions($request->integer('lead_id') ?: null, $request->integer('customer_id') ?: null));
    }

    public function store(StoreFollowUpRequest $request): RedirectResponse
    {
        $data = $this->validatedLinkedData($request->validated());
        $data['status'] = $data['status'] ?? 'pending';
        $data['created_by_id'] = $request->user()->id;
        $followUp = FollowUp::create($data);
        $followUp->load(['lead', 'customer']);

        return redirect()->route('follow-ups.index')->with('success', "Follow-up for {$followUp->subjectName()} scheduled.");
    }

    public function edit(Request $request, FollowUp $followUp): Response
    {
        abort_unless($request->user()->can('update', $followUp), 403);
        $followUp->load(['lead:id,name,business,email', 'customer:id,name,business,email', 'owner:id,name,email,avatar_path']);

        return Inertia::render('follow-ups/edit', ['followUp' => $this->payload($followUp), ...$this->formOptions($followUp->lead_id, $followUp->customer_id)]);
    }

    public function update(UpdateFollowUpRequest $request, FollowUp $followUp, ActivityLogger $logger): RedirectResponse
    {
        $oldStatus = $followUp->status;
        $followUp->update($this->validatedLinkedData($request->validated()));

        if ($oldStatus !== $followUp->status) {
            $logger->log('follow_up.status_changed', $followUp, 'Follow-up status changed', [
                'old' => ['status' => $oldStatus],
                'new' => ['status' => $followUp->status],
            ]);
        }

        return redirect()->route('follow-ups.index')->with('success', 'Follow-up updated.');
    }

    public function complete(Request $request, FollowUp $followUp, ActivityLogger $logger): RedirectResponse
    {
        abort_unless($request->user()->can('complete', $followUp), 403);
        if ($followUp->status === 'completed') return back()->with('info', 'This follow-up is already completed.');

        $followUp->update(['status' => 'completed', 'completed_at' => now(), 'completed_by_id' => $request->user()->id]);
        $logger->log('follow_up.completed', $followUp, 'Follow-up completed');
        if ($followUp->customer_id) {
            $customer = Customer::query()->find($followUp->customer_id);
            $customer?->update(['last_contacted_at' => now()]);
        }

        if ($request->boolean('create_next')) {
            $nextDate = $request->date('next_scheduled_at');
            if ($nextDate) {
                FollowUp::create([
                    'lead_id' => $followUp->lead_id,
                    'customer_id' => $followUp->customer_id,
                    'reason' => $followUp->reason,
                    'notes' => $request->string('next_notes')->toString() ?: null,
                    'owner_id' => $followUp->owner_id,
                    'scheduled_at' => $nextDate,
                    'status' => 'pending',
                    'created_by_id' => $request->user()->id,
                ]);
            }
        }

        return back()->with('success', 'Follow-up marked as completed.');
    }

    public function cancel(Request $request, FollowUp $followUp, ActivityLogger $logger): RedirectResponse
    {
        abort_unless($request->user()->can('update', $followUp), 403);
        $followUp->update(['status' => 'cancelled']);
        $logger->log('follow_up.cancelled', $followUp, 'Follow-up cancelled');

        return back()->with('success', 'Follow-up cancelled.');
    }

    public function destroy(Request $request, FollowUp $followUp): RedirectResponse
    {
        abort_unless($request->user()->can('delete', $followUp), 403);
        $followUp->delete();

        return back()->with('success', 'Follow-up deleted.');
    }

    /** @return array<string, mixed> */
    private function formOptions(?int $leadId = null, ?int $customerId = null): array
    {
        $leads = Lead::query()->whereNull('deleted_at')->orderBy('name')->limit(500)->get(['id', 'name', 'business', 'email']);
        $customers = Customer::query()->whereNull('deleted_at')->orderBy('name')->limit(500)->get(['id', 'name', 'business', 'email']);

        if ($leadId && ! $leads->contains('id', $leadId)) $leads->push(Lead::query()->findOrFail($leadId, ['id', 'name', 'business', 'email']));
        if ($customerId && ! $customers->contains('id', $customerId)) $customers->push(Customer::query()->findOrFail($customerId, ['id', 'name', 'business', 'email']));

        return [
            'leads' => $leads,
            'customers' => $customers,
            'owners' => $this->owners(),
        ];
    }

    private function owners()
    {
        return User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']);
    }

    /** @param array<string, mixed> $data */
    private function validatedLinkedData(array $data): array
    {
        if (empty($data['lead_id']) === empty($data['customer_id'])) {
            abort(422, 'Choose exactly one lead or customer for this follow-up.');
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function payload(FollowUp $followUp): array
    {
        $subject = $followUp->lead ?? $followUp->customer;

        return [
            'id' => $followUp->id,
            'lead_id' => $followUp->lead_id,
            'customer_id' => $followUp->customer_id,
            'reason' => $followUp->reason,
            'notes' => $followUp->notes,
            'owner_id' => $followUp->owner_id,
            'owner' => $followUp->owner ? ['id' => $followUp->owner->id, 'name' => $followUp->owner->name, 'email' => $followUp->owner->email, 'avatar_url' => $followUp->owner->avatar_url] : null,
            'scheduled_at' => $followUp->scheduled_at?->toISOString(),
            'status' => $followUp->status,
            'status_label' => str($followUp->status)->headline()->toString(),
            'is_overdue' => $followUp->isOverdue(),
            'completed_at' => $followUp->completed_at?->toISOString(),
            'subject' => $subject ? ['id' => $subject->id, 'name' => $subject->name, 'business' => $subject->business, 'type' => $followUp->lead_id ? 'lead' : 'customer'] : null,
            'created_at' => $followUp->created_at?->toISOString(),
            'updated_at' => $followUp->updated_at?->toISOString(),
        ];
    }
}
