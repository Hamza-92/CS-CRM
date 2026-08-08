<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDealRequest;
use App\Http\Requests\UpdateDealRequest;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\DealStage;
use App\Models\Lead;
use App\Models\Plan;
use App\Models\Product;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    private const SORTABLE = ['title', 'amount', 'probability', 'expected_close_date', 'created_at'];

    public function index(Request $request): Response { return $this->listing($request, false); }
    public function archived(Request $request): Response { return $this->listing($request, true); }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Deal::class);

        return Inertia::render('deals/create', [
            ...$this->formOptions(),
            'defaults' => [
                'lead_id' => $request->integer('lead_id') ?: null,
                'customer_id' => $request->integer('customer_id') ?: null,
                'stage_id' => $request->integer('stage_id') ?: DealStage::query()->active()->orderBy('sort_order')->value('id'),
                'currency' => config('crm.default_currency', 'USD'),
            ],
        ]);
    }

    public function store(StoreDealRequest $request): RedirectResponse
    {
        $data = $this->normalized($request->validated());
        $deal = Deal::create($data);

        return redirect()->route('deals.show', $deal)->with('success', "Deal {$deal->title} created.");
    }

    public function show(Request $request, Deal $deal): Response
    {
        Gate::authorize('view', $deal);
        $deal->load([
            'lead:id,name,business,email,phone', 'customer:id,name,business,email,phone',
            'product:id,name,code,brand_color', 'plan:id,product_id,name,code,billing_cycle,price,currency',
            'stage:id,name,slug,color,probability,is_won,is_lost', 'owner:id,name,email,avatar_path',
            'followUps.owner:id,name,email,avatar_path',
        ]);

        return Inertia::render('deals/show', [
            'deal' => $this->payload($deal),
            'activities' => $deal->activities()->with('user:id,name,avatar_path')->limit(30)->get(),
            'followUps' => $deal->followUps->sortByDesc('scheduled_at')->values()->map(fn ($followUp) => [
                'id' => $followUp->id, 'reason' => $followUp->reason,
                'scheduled_at' => $followUp->scheduled_at?->toISOString(), 'status' => $followUp->status,
                'status_label' => str($followUp->status)->headline()->toString(), 'is_overdue' => $followUp->isOverdue(),
                'owner' => $followUp->owner ? ['id' => $followUp->owner->id, 'name' => $followUp->owner->name, 'email' => $followUp->owner->email, 'avatar_url' => $followUp->owner->avatar_url] : null,
            ])->all(),
            'can' => [
                'update' => $request->user()->can('update', $deal),
                'archive' => $request->user()->can('delete', $deal),
                'create_follow_up' => $request->user()->can('create', \App\Models\FollowUp::class),
            ],
        ]);
    }

    public function edit(Deal $deal): Response
    {
        Gate::authorize('update', $deal);
        $deal->load(['lead', 'customer', 'product', 'plan', 'stage', 'owner']);

        return Inertia::render('deals/edit', ['deal' => $this->payload($deal), ...$this->formOptions($deal)]);
    }

    public function update(UpdateDealRequest $request, Deal $deal, ActivityLogger $logger): RedirectResponse
    {
        $oldStageId = $deal->stage_id;
        $oldStage = $deal->stage()->value('name');
        $deal->update($this->normalized($request->validated(), $deal));
        if ($oldStageId !== $deal->stage_id) $this->logStageChange($deal, $oldStageId, $oldStage, $logger);

        return redirect()->route('deals.show', $deal)->with('success', "Deal {$deal->title} updated.");
    }

    public function updateStage(Request $request, Deal $deal, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $deal);
        $data = $request->validate([
            'stage_id' => ['required', 'integer', Rule::exists('deal_stages', 'id')->where('status', 'active')],
            'loss_reason' => ['nullable', 'string', 'max:5000'],
        ]);
        $stage = DealStage::query()->findOrFail($data['stage_id']);
        if ($stage->is_lost && blank($data['loss_reason'] ?? null)) return back()->with('error', 'Add a reason before marking this deal as lost.');

        $oldStageId = $deal->stage_id;
        $oldStage = $deal->stage()->value('name');
        if ($oldStageId === $stage->id) return back()->with('info', 'The deal is already in this stage.');

        $deal->update([
            'stage_id' => $stage->id,
            'probability' => $stage->probability,
            'won_at' => $stage->is_won ? now() : null,
            'lost_at' => $stage->is_lost ? now() : null,
            'loss_reason' => $stage->is_lost ? $data['loss_reason'] : null,
        ]);
        $this->logStageChange($deal, $oldStageId, $oldStage, $logger);

        return back()->with('success', "Deal moved to {$stage->name}.");
    }

    public function destroy(Deal $deal): RedirectResponse
    {
        Gate::authorize('delete', $deal);
        $deal->delete();
        return redirect()->route('deals.index')->with('success', "Deal {$deal->title} archived.");
    }

    public function restore(Deal $deal): RedirectResponse
    {
        Gate::authorize('restore', $deal);
        $deal->restore();
        return redirect()->route('deals.show', $deal)->with('success', "Deal {$deal->title} restored.");
    }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', Deal::class);
        $sort = in_array($request->string('sort')->toString(), self::SORTABLE, true) ? $request->string('sort')->toString() : 'created_at';
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;

        $base = Deal::query()->with(['lead:id,name,business', 'customer:id,name,business', 'product:id,name,code,brand_color', 'plan:id,name,code', 'stage:id,name,slug,color,probability,is_won,is_lost', 'owner:id,name,email,avatar_path'])
            ->search($request->string('search')->toString())
            ->when($request->filled('stage_id'), fn (Builder $query) => $query->where('stage_id', $request->integer('stage_id')))
            ->when($request->filled('owner_id'), fn (Builder $query) => $query->where('owner_id', $request->integer('owner_id')))
            ->when($request->filled('product_id'), fn (Builder $query) => $query->where('product_id', $request->integer('product_id')))
            ->when($archived, fn (Builder $query) => $query->onlyTrashed());

        $deals = (clone $base)->orderBy($sort, $direction)->paginate($perPage)->withQueryString();
        $deals->through(fn (Deal $deal) => $this->payload($deal));
        $pipelineDeals = $archived ? collect() : (clone $base)->orderBy('expected_close_date')->get();
        $stages = DealStage::query()->orderBy('sort_order')->orderBy('name')->get();

        $active = Deal::query()->whereHas('stage', fn (Builder $query) => $query->where('is_won', false)->where('is_lost', false));
        $won = Deal::query()->whereHas('stage', fn (Builder $query) => $query->where('is_won', true));
        $summaryCurrency = config('crm.default_currency', 'USD');

        return Inertia::render($archived ? 'deals/archived' : 'deals/index', [
            'deals' => $deals,
            'board' => $archived ? [] : $stages->where('status', 'active')->map(fn (DealStage $stage) => [
                'id' => $stage->id, 'name' => $stage->name, 'slug' => $stage->slug, 'color' => $stage->color,
                'probability' => $stage->probability, 'is_won' => $stage->is_won, 'is_lost' => $stage->is_lost,
                'deals' => $pipelineDeals->where('stage_id', $stage->id)->values()->map(fn (Deal $deal) => $this->payload($deal))->all(),
            ])->values()->all(),
            'stages' => $stages->map(fn (DealStage $stage) => ['value' => (string) $stage->id, 'label' => $stage->name, 'color' => $stage->color, 'status' => $stage->status])->values()->all(),
            'owners' => $this->owners(),
            'products' => Product::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
            'filters' => ['search' => $request->string('search')->toString(), 'stage_id' => $request->string('stage_id')->toString(), 'owner_id' => $request->string('owner_id')->toString(), 'product_id' => $request->string('product_id')->toString(), 'sort' => $sort, 'direction' => $direction, 'per_page' => $perPage],
            'summary' => $archived ? null : [
                'pipeline' => (float) (clone $active)->where('currency', $summaryCurrency)->sum('amount'),
                'weighted' => (float) (clone $active)->where('currency', $summaryCurrency)->selectRaw('SUM(amount * probability / 100) as total')->value('total'),
                'closing_this_month' => (clone $active)->whereBetween('expected_close_date', [now()->startOfMonth(), now()->endOfMonth()])->count(),
                'won_this_month' => (float) (clone $won)->where('currency', $summaryCurrency)->whereBetween('won_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('amount'),
                'currency' => $summaryCurrency,
            ],
            'can' => [
                'create' => $request->user()->can(\App\Enums\Permission::CreateDeals->value) || $request->user()->can(\App\Enums\Permission::ManageDeals->value),
                'update' => $request->user()->can(\App\Enums\Permission::EditDeals->value) || $request->user()->can(\App\Enums\Permission::ManageDeals->value),
                'archive' => $request->user()->can(\App\Enums\Permission::ArchiveDeals->value) || $request->user()->can(\App\Enums\Permission::ManageDeals->value),
                'manage_stages' => $request->user()->can(\App\Enums\Permission::ManageDealStages->value) || $request->user()->can(\App\Enums\Permission::ManageDeals->value),
            ],
        ]);
    }

    private function normalized(array $data, ?Deal $existing = null): array
    {
        if (! empty($data['plan_id']) && Plan::query()->whereKey($data['plan_id'])->where('product_id', $data['product_id'])->doesntExist()) abort(422, 'The selected plan does not belong to this product.');
        $stage = DealStage::query()->findOrFail($data['stage_id']);
        $data['currency'] = strtoupper($data['currency']);
        $data['probability'] = filled($data['probability'] ?? null) ? (int) $data['probability'] : $stage->probability;
        $data['won_at'] = $stage->is_won ? ($existing?->won_at ?? now()) : null;
        $data['lost_at'] = $stage->is_lost ? ($existing?->lost_at ?? now()) : null;
        if (! $stage->is_lost) $data['loss_reason'] = null;
        return $data;
    }

    private function logStageChange(Deal $deal, int $oldStageId, ?string $oldStage, ActivityLogger $logger): void
    {
        $deal->load('stage');
        $logger->log('deal.stage_changed', $deal, "Deal {$deal->title} moved to {$deal->stage->name}", [
            'old' => ['stage_id' => $oldStageId, 'stage' => $oldStage],
            'new' => ['stage_id' => $deal->stage_id, 'stage' => $deal->stage->name],
        ]);
    }

    private function formOptions(?Deal $deal = null): array
    {
        return [
            'leads' => Lead::query()->orderBy('name')->limit(500)->get(['id', 'name', 'business', 'email']),
            'customers' => Customer::query()->orderBy('name')->limit(500)->get(['id', 'name', 'business', 'email']),
            'products' => Product::query()->with(['plans' => fn ($query) => $query->where('is_active', true)->whereNull('deleted_at')])->active()->orderBy('name')->get(['id', 'name', 'code', 'brand_color']),
            'stages' => DealStage::query()->when($deal, fn ($query) => $query->where(fn ($query) => $query->where('status', 'active')->orWhereKey($deal->stage_id)), fn ($query) => $query->active())->orderBy('sort_order')->get(),
            'owners' => $this->owners(),
            'currencies' => collect(config('crm.currencies', ['USD']))->map(fn ($label, $value) => is_int($value)
                ? ['value' => $label, 'label' => $label]
                : ['value' => $value, 'label' => "{$value} · {$label}"])->values(),
        ];
    }

    private function owners()
    {
        return User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']);
    }

    private function payload(Deal $deal): array
    {
        return [
            'id' => $deal->id, 'title' => $deal->title, 'lead_id' => $deal->lead_id, 'customer_id' => $deal->customer_id,
            'product_id' => $deal->product_id, 'plan_id' => $deal->plan_id, 'stage_id' => $deal->stage_id, 'owner_id' => $deal->owner_id,
            'amount' => $deal->amount, 'currency' => $deal->currency, 'probability' => $deal->probability,
            'expected_close_date' => $deal->expected_close_date?->toDateString(), 'next_step' => $deal->next_step,
            'notes' => $deal->notes, 'loss_reason' => $deal->loss_reason, 'won_at' => $deal->won_at?->toISOString(), 'lost_at' => $deal->lost_at?->toISOString(),
            'lead' => $deal->lead ? ['id' => $deal->lead->id, 'name' => $deal->lead->name, 'business' => $deal->lead->business] : null,
            'customer' => $deal->customer ? ['id' => $deal->customer->id, 'name' => $deal->customer->name, 'business' => $deal->customer->business] : null,
            'product' => $deal->product ? ['id' => $deal->product->id, 'name' => $deal->product->name, 'code' => $deal->product->code, 'brand_color' => $deal->product->brand_color] : null,
            'plan' => $deal->plan ? ['id' => $deal->plan->id, 'name' => $deal->plan->name, 'code' => $deal->plan->code] : null,
            'stage' => $deal->stage ? ['id' => $deal->stage->id, 'name' => $deal->stage->name, 'slug' => $deal->stage->slug, 'color' => $deal->stage->color, 'probability' => $deal->stage->probability, 'is_won' => $deal->stage->is_won, 'is_lost' => $deal->stage->is_lost] : null,
            'owner' => $deal->owner ? ['id' => $deal->owner->id, 'name' => $deal->owner->name, 'email' => $deal->owner->email, 'avatar_url' => $deal->owner->avatar_url] : null,
            'created_at' => $deal->created_at?->toISOString(), 'updated_at' => $deal->updated_at?->toISOString(), 'deleted_at' => $deal->deleted_at?->toISOString(),
        ];
    }
}
