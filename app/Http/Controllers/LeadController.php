<?php

namespace App\Http\Controllers;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadSourceOption;
use App\Models\LeadStatusOption;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    private const SORTABLE = ['name', 'business', 'status', 'next_follow_up_at', 'created_at'];

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
        abort_unless($request->user()->can('create', Lead::class), 403);

        return Inertia::render('leads/create', $this->formOptions());
    }

    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $lead = Lead::create($request->validated());

        return redirect()->route('leads.show', $lead)->with('success', "Lead {$lead->name} created.");
    }

    public function show(Request $request, Lead $lead): Response
    {
        abort_unless($request->user()->can('view', $lead), 403);
        $lead->load(['owner:id,name,email,avatar_path', 'customer:id,name,business', 'statusDefinition', 'sourceDefinition', 'followUps.owner:id,name,email,avatar_path']);

        $products = Product::query()
            ->whereIn('id', $lead->interested_products ?? [])
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('leads/show', [
            'lead' => $this->payload($lead),
            'products' => $products,
            'followUps' => $lead->followUps->sortByDesc('scheduled_at')->values()->map(fn ($followUp) => [
                'id' => $followUp->id,
                'reason' => $followUp->reason,
                'scheduled_at' => $followUp->scheduled_at?->toISOString(),
                'status' => $followUp->status,
                'status_label' => \Illuminate\Support\Str::headline($followUp->status),
                'is_overdue' => $followUp->isOverdue(),
                'owner' => $followUp->owner ? ['id' => $followUp->owner->id, 'name' => $followUp->owner->name, 'email' => $followUp->owner->email, 'avatar_url' => $followUp->owner->avatar_url] : null,
            ])->all(),
            'can' => [
                'update' => $request->user()->can('update', $lead),
                'create_follow_up' => $request->user()->can('create', \App\Models\FollowUp::class),
                'archive' => $request->user()->can('delete', $lead),
                'convert' => $request->user()->can('convert', $lead),
            ],
        ]);
    }

    public function edit(Request $request, Lead $lead): Response|RedirectResponse
    {
        abort_unless($request->user()->can('update', $lead), 403);

        if ($lead->status === LeadStatus::Converted->value) {
            return redirect()->route('leads.show', $lead)->with('error', 'Converted leads are managed from the customer record.');
        }

        return Inertia::render('leads/edit', ['lead' => $this->payload($lead), ...$this->formOptions()]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        $lead->update($request->validated());

        return redirect()->route('leads.show', $lead)->with('success', "Lead {$lead->name} updated.");
    }

    public function convert(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless($request->user()->can('convert', $lead), 403);

        if ($lead->customer_id) {
            return redirect()->route('customers.show', $lead->customer_id)->with('info', 'This lead has already been converted.');
        }

        $customer = DB::transaction(function () use ($lead): Customer {
            $customer = Customer::create([
                'name' => $lead->name,
                'business' => $lead->business,
                'phone' => $lead->phone,
                'whatsapp' => $lead->whatsapp,
                'email' => $lead->email,
                'city' => $lead->city,
                'source' => $lead->source,
                'owner_id' => $lead->owner_id,
                'notes' => $lead->notes,
                'converted_from_lead_id' => $lead->id,
                'status' => 'active',
            ]);

            $lead->update([
                'status' => LeadStatus::Converted->value,
                'customer_id' => $customer->id,
                'converted_at' => now(),
            ]);

            return $customer;
        });

        return redirect()->route('customers.show', $customer)->with('success', "{$lead->name} converted to a customer.");
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless($request->user()->can('update', $lead), 403);
        $data = $request->validate(['status' => ['required', 'string', 'exists:lead_statuses,slug']]);
        $lead->update(['status' => $data['status']]);
        $lead->load('statusDefinition');

        return back()->with('success', "Lead {$lead->name} moved to ".($lead->statusDefinition?->name ?? Str::headline($lead->status)).'.');
    }

    public function destroy(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless($request->user()->can('delete', $lead), 403);
        $lead->delete();

        return redirect()->route('leads.index')->with('success', "Lead {$lead->name} archived.");
    }

    public function restore(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless($request->user()->can('restore', $lead), 403);
        $lead->restore();

        return redirect()->route('leads.archived')->with('success', "Lead {$lead->name} restored.");
    }

    private function listing(Request $request, bool $archived): Response
    {
        abort_unless($request->user()->can('viewAny', Lead::class), 403);

        $sort = $request->string('sort', 'created_at')->toString();
        $sort = in_array($sort, self::SORTABLE, true) ? $sort : 'created_at';
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $allStatuses = LeadStatusOption::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'color', 'status', 'description', 'sort_order']);
        $allSources = LeadSourceOption::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'status', 'description', 'sort_order']);
        $status = ! $archived && $allStatuses->contains('slug', $request->string('status')->toString())
            ? $request->string('status')->toString()
            : '';
        $source = $allSources->contains('slug', $request->string('source')->toString())
            ? $request->string('source')->toString()
            : '';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true) ? $request->integer('per_page', 10) : 10;

        $leads = Lead::query()
            ->with(['owner:id,name,email,avatar_path', 'customer:id,name,business', 'statusDefinition', 'sourceDefinition'])
            ->search($request->string('search')->toString())
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($source !== '', fn (Builder $query) => $query->where('source', $source))
            ->when($request->filled('owner_id'), fn (Builder $query) => $query->where('owner_id', $request->integer('owner_id')))
            ->when($archived, fn (Builder $query) => $query->onlyTrashed())
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $leads->through(fn (Lead $lead): array => $this->payload($lead));

        return Inertia::render($archived ? 'leads/archived' : 'leads/index', [
            'leads' => $leads,
            'owners' => $this->owners(),
            'statuses' => $allStatuses->map(fn (LeadStatusOption $option) => ['value' => $option->slug, 'label' => $option->name, 'color' => $option->color, 'status' => $option->status])->values()->all(),
            'sources' => $allSources->map(fn (LeadSourceOption $option) => ['value' => $option->slug, 'label' => $option->name, 'status' => $option->status])->values()->all(),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $status,
                'source' => $source,
                'owner_id' => $request->string('owner_id')->toString(),
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'kanban' => $this->kanban($request, $archived, $status, $source),
            'can' => [
                'create' => $request->user()->can('create', Lead::class),
                'update' => $request->user()->can('update', Lead::class),
                'archive' => $request->user()->can('delete', Lead::class),
                'convert' => $request->user()->can('convert', Lead::class),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function formOptions(): array
    {
        return [
            'owners' => $this->owners(),
            'products' => Product::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
            'statuses' => LeadStatusOption::query()->active()->orderBy('sort_order')->orderBy('name')->get(['slug as value', 'name as label', 'color']),
            'sources' => LeadSourceOption::query()->active()->orderBy('sort_order')->orderBy('name')->get(['slug as value', 'name as label']),
        ];
    }

    private function owners()
    {
        return User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']);
    }

    /** @return array<string, mixed> */
    private function payload(Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'name' => $lead->name,
            'business' => $lead->business,
            'phone' => $lead->phone,
            'whatsapp' => $lead->whatsapp,
            'email' => $lead->email,
            'city' => $lead->city,
            'source' => $lead->source,
            'source_label' => $lead->sourceDefinition?->name ?? ($lead->source ? (LeadSource::tryFrom($lead->source)?->label() ?? Str::headline($lead->source)) : null),
            'status' => $lead->status,
            'status_label' => $lead->statusDefinition?->name ?? $lead->statusLabel(),
            'status_color' => $lead->statusDefinition?->color ?? '#3B82F6',
            'owner_id' => $lead->owner_id,
            'owner' => $lead->owner ? ['id' => $lead->owner->id, 'name' => $lead->owner->name, 'email' => $lead->owner->email, 'avatar_url' => $lead->owner->avatar_url] : null,
            'interested_products' => $lead->interested_products ?? [],
            'next_follow_up_at' => $lead->next_follow_up_at?->toISOString(),
            'notes' => $lead->notes,
            'customer_id' => $lead->customer_id,
            'customer' => $lead->customer ? ['id' => $lead->customer->id, 'name' => $lead->customer->name, 'business' => $lead->customer->business] : null,
            'converted_at' => $lead->converted_at?->toISOString(),
            'created_at' => $lead->created_at?->toISOString(),
            'updated_at' => $lead->updated_at?->toISOString(),
            'deleted_at' => $lead->deleted_at?->toISOString(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function kanban(Request $request, bool $archived, string $status, string $source): array
    {
        $columns = LeadStatusOption::query()->active()->orderBy('sort_order')->orderBy('name')->get();
        $leads = Lead::query()
            ->with(['owner:id,name,email,avatar_path', 'customer:id,name,business', 'statusDefinition', 'sourceDefinition'])
            ->search($request->string('search')->toString())
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($source !== '', fn (Builder $query) => $query->where('source', $source))
            ->when($request->filled('owner_id'), fn (Builder $query) => $query->where('owner_id', $request->integer('owner_id')))
            ->when($archived, fn (Builder $query) => $query->onlyTrashed())
            ->latest('created_at')
            ->get();

        return $columns->map(fn (LeadStatusOption $column): array => [
            'id' => $column->id,
            'slug' => $column->slug,
            'name' => $column->name,
            'color' => $column->color,
            'description' => $column->description,
            'leads' => $leads->where('status', $column->slug)->values()->map(fn (Lead $lead) => $this->payload($lead))->all(),
        ])->values()->all();
    }
}
