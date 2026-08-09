<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupportTicketRequest;
use App\Http\Requests\UpdateSupportTicketRequest;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\Audit\ActivityLogger;
use App\Services\AssignmentRouter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    private const SORTABLE = ['ticket_number', 'subject', 'priority', 'status', 'due_at', 'created_at'];
    public function index(Request $request): Response { return $this->listing($request, false); }
    public function archived(Request $request): Response { return $this->listing($request, true); }
    public function create(): Response { Gate::authorize('create', SupportTicket::class); return Inertia::render('support-tickets/create', $this->options()); }

    public function store(StoreSupportTicketRequest $request, AssignmentRouter $router): RedirectResponse
    {
        $data = $request->validated(); $data['assigned_to_id'] = $router->forSupportTicket($data)?->id; $data['ticket_number'] = $this->nextNumber(); $data['created_by_id'] = $request->user()->id;
        $ticket = SupportTicket::create($this->timestamps($data));
        return redirect()->route('support-tickets.show', $ticket)->with('success', "Ticket {$ticket->ticket_number} created.");
    }

    public function show(Request $request, SupportTicket $supportTicket): Response
    {
        Gate::authorize('view', $supportTicket);
        $supportTicket->load(['customer:id,name,business,email', 'applicationInstance:id,name,customer_id,product_id,environment,status', 'applicationInstance.product:id,name,code,brand_color', 'assignedTo:id,name,email,avatar_path', 'createdBy:id,name,email,avatar_path']);
        return Inertia::render('support-tickets/show', ['ticket' => $this->payload($supportTicket), 'activities' => $supportTicket->activities()->with('user:id,name,avatar_path')->limit(20)->get(), 'can' => ['update' => $request->user()->can('update', $supportTicket), 'archive' => $request->user()->can('delete', $supportTicket)]]);
    }

    public function edit(SupportTicket $supportTicket): Response { Gate::authorize('update', $supportTicket); return Inertia::render('support-tickets/edit', [...$this->options(), 'ticket' => $this->payload($supportTicket)]); }

    public function update(UpdateSupportTicketRequest $request, SupportTicket $supportTicket, ActivityLogger $logger): RedirectResponse
    {
        $before = $supportTicket->only(['status', 'priority', 'assigned_to_id']); $supportTicket->update($this->timestamps($request->validated())); $after = $supportTicket->only(array_keys($before));
        if ($before['status'] !== $after['status']) $logger->log('support_ticket.status_changed', $supportTicket, 'Support ticket status changed', ['old' => ['status' => $before['status']], 'new' => ['status' => $after['status']]]);
        if ($before['assigned_to_id'] !== $after['assigned_to_id']) $logger->log('support_ticket.assigned', $supportTicket, 'Support ticket assignment changed', ['old' => ['assigned_to_id' => $before['assigned_to_id']], 'new' => ['assigned_to_id' => $after['assigned_to_id']]]);
        return redirect()->route('support-tickets.show', $supportTicket)->with('success', "Ticket {$supportTicket->ticket_number} updated.");
    }

    public function updateStatus(Request $request, SupportTicket $supportTicket, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $supportTicket); $status = $request->validate(['status' => ['required', \Illuminate\Validation\Rule::in(SupportTicket::STATUSES)]])['status'];
        $old = $supportTicket->status; $supportTicket->update($this->timestamps(['status' => $status]));
        if ($old !== $status) $logger->log('support_ticket.status_changed', $supportTicket, 'Support ticket status changed', ['old' => ['status' => $old], 'new' => ['status' => $status]]);
        return back()->with('success', 'Ticket status updated.');
    }

    public function destroy(SupportTicket $supportTicket): RedirectResponse { Gate::authorize('delete', $supportTicket); $supportTicket->delete(); return redirect()->route('support-tickets.index')->with('success', "Ticket {$supportTicket->ticket_number} archived."); }
    public function restore(SupportTicket $supportTicket): RedirectResponse { Gate::authorize('restore', $supportTicket); $supportTicket->restore(); return redirect()->route('support-tickets.show', $supportTicket)->with('success', 'Ticket restored.'); }

    private function listing(Request $request, bool $archived): Response
    {
        Gate::authorize('viewAny', SupportTicket::class); $requestedSort = $request->string('sort', 'created_at')->toString(); $sort = in_array($requestedSort, self::SORTABLE, true) ? $requestedSort : 'created_at'; $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc'; $perPage = in_array($request->integer('per_page', 12), [12, 25, 50, 100], true) ? $request->integer('per_page', 12) : 12;
        $query = SupportTicket::query()->with(['customer:id,name,business', 'applicationInstance:id,name,customer_id,product_id,environment', 'assignedTo:id,name,avatar_path'])->search($request->string('search')->toString()); $query->when($archived, fn (Builder $q) => $q->onlyTrashed()); $query->when(! $archived && in_array($request->string('status')->toString(), SupportTicket::STATUSES, true), fn (Builder $q) => $q->where('status', $request->string('status')->toString())); $query->when(! $archived && in_array($request->string('priority')->toString(), SupportTicket::PRIORITIES, true), fn (Builder $q) => $q->where('priority', $request->string('priority')->toString())); $query->when($request->filled('assigned_to_id'), fn (Builder $q) => $q->where('assigned_to_id', $request->integer('assigned_to_id')));
        $tickets = $query->orderByRaw("CASE WHEN status NOT IN ('resolved','closed') AND due_at < ? THEN 0 ELSE 1 END", [today()])->orderBy($sort, $direction)->paginate($perPage)->withQueryString(); $stats = collect(SupportTicket::STATUSES)->mapWithKeys(fn (string $status) => [$status => SupportTicket::query()->where('status', $status)->count()]);
        return Inertia::render($archived ? 'support-tickets/archived' : 'support-tickets/index', ['tickets' => $tickets, 'filters' => ['search' => $request->string('search')->toString(), 'status' => $request->string('status')->toString(), 'priority' => $request->string('priority')->toString(), 'assigned_to_id' => $request->integer('assigned_to_id') ?: null, 'sort' => $sort, 'direction' => $direction, 'per_page' => $perPage], 'stats' => $archived ? null : $stats, 'options' => ['assignees' => $this->assignees()]]);
    }

    private function options(): array { return ['customers' => Customer::query()->orderBy('name')->get(['id', 'name', 'business', 'email']), 'instances' => $this->instances(), 'assignees' => $this->assignees()]; }
    private function instances(): Collection { return ApplicationInstance::query()->with(['customer:id,name,business', 'product:id,name,code'])->where('status', '!=', 'retired')->orderBy('name')->get(['id', 'name', 'customer_id', 'product_id', 'environment', 'status']); }
    private function assignees(): Collection { return User::query()->active()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']); }
    private function nextNumber(): string { $number = SupportTicket::withTrashed()->max('id') + 1; return 'TKT-'.now()->format('Y').'-'.str_pad((string) $number, 5, '0', STR_PAD_LEFT); }
    private function timestamps(array $data): array { if (($data['status'] ?? null) === 'resolved' && ! isset($data['resolved_at'])) $data['resolved_at'] = now(); if (($data['status'] ?? null) === 'closed' && ! isset($data['closed_at'])) $data['closed_at'] = now(); if (isset($data['status']) && $data['status'] !== 'resolved') $data['resolved_at'] = null; if (isset($data['status']) && $data['status'] !== 'closed') $data['closed_at'] = null; return $data; }
    private function payload(SupportTicket $ticket): array { return [...$ticket->toArray(), 'status_label' => Str::headline($ticket->status), 'priority_label' => Str::headline($ticket->priority), 'category_label' => Str::headline($ticket->category), 'is_overdue' => $ticket->isOverdue(), 'customer' => $ticket->customer, 'application_instance' => $ticket->applicationInstance, 'assigned_to' => $ticket->assignedTo ? [...$ticket->assignedTo->toArray(), 'avatar_url' => $ticket->assignedTo->avatar_url] : null]; }
}
