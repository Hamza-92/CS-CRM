<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\FollowUp;
use App\Models\SupportTicket;
use App\Models\WorkTask;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class MyWorkController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $teamView = $user->can(Permission::ViewUsers->value);
        $view = $request->string('view', 'all')->toString();
        $view = in_array($view, ['all', 'overdue', 'today', 'upcoming'], true) ? $view : 'all';
        $search = trim($request->string('search')->toString());
        $type = $request->string('type')->toString();
        $today = today();
        $items = collect();

        if ($user->can(Permission::ViewTasks->value)) {
            $query = WorkTask::query()->whereIn('status', ['open', 'in_progress'])->with(['customer:id,name,business', 'applicationInstance:id,name', 'assignedTo:id,name'])->when(! $teamView, fn (Builder $q) => $q->where('assigned_to_id', $user->id));
            $this->applyDateFilter($query, $view, 'due_at', $today);
            $items = $items->merge($query->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')->orderBy('due_at')->limit(100)->get()->map(fn (WorkTask $task): array => [
                'id' => "task-{$task->id}", 'type' => 'Task', 'title' => $task->title, 'meta' => $task->task_number.' · '.($task->applicationInstance?->name ?: ($task->customer?->business ?: $task->customer?->name ?: 'Unlinked')), 'owner' => $task->assignedTo?->name, 'due_at' => $task->due_at?->toDateString(), 'status' => $task->status, 'priority' => $task->priority, 'overdue' => $task->isOverdue(), 'href' => "/tasks/{$task->id}",
            ]));
        }

        if ($user->can(Permission::ViewFollowUps->value)) {
            $query = FollowUp::query()->whereIn('status', ['pending', 'rescheduled'])->with(['owner:id,name', 'lead:id,name,business', 'customer:id,name,business', 'deal:id,title', 'applicationInstance:id,name'])->when(! $teamView, fn (Builder $q) => $q->where('owner_id', $user->id));
            $this->applyDateFilter($query, $view, 'scheduled_at', $today);
            $items = $items->merge($query->orderBy('scheduled_at')->limit(100)->get()->map(fn (FollowUp $followUp): array => [
                'id' => "follow-up-{$followUp->id}", 'type' => 'Follow-up', 'title' => $followUp->reason, 'meta' => $followUp->subjectName(), 'owner' => $followUp->owner?->name, 'due_at' => $followUp->scheduled_at?->toIso8601String(), 'status' => $followUp->status, 'priority' => null, 'overdue' => $followUp->isOverdue(), 'href' => '/follow-ups',
            ]));
        }

        if ($user->can(Permission::ViewSupportTickets->value)) {
            $query = SupportTicket::query()->whereNotIn('status', ['resolved', 'closed'])->with(['assignedTo:id,name', 'customer:id,name,business'])->when(! $teamView, fn (Builder $q) => $q->where('assigned_to_id', $user->id));
            $this->applyDateFilter($query, $view, 'due_at', $today);
            $items = $items->merge($query->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')->orderBy('due_at')->limit(100)->get()->map(fn (SupportTicket $ticket): array => [
                'id' => "ticket-{$ticket->id}", 'type' => 'Ticket', 'title' => $ticket->subject, 'meta' => $ticket->ticket_number.' · '.($ticket->customer?->business ?: ($ticket->customer?->name ?: 'Unlinked')), 'owner' => $ticket->assignedTo?->name, 'due_at' => $ticket->due_at?->toDateString(), 'status' => $ticket->status, 'priority' => $ticket->priority, 'overdue' => $ticket->isOverdue(), 'href' => "/support-tickets/{$ticket->id}",
            ]));
        }

        $items = $items
            ->when($search !== '', fn (Collection $collection) => $collection->filter(fn (array $item) => str_contains(strtolower($item['title'].' '.$item['meta'].' '.($item['owner'] ?? '')), strtolower($search))))
            ->when(in_array($type, ['Task', 'Follow-up', 'Ticket'], true), fn (Collection $collection) => $collection->where('type', $type))
            ->sortBy(fn (array $item) => [$item['overdue'] ? 0 : 1, $item['due_at'] ?? '9999-12-31'])->values();
        return Inertia::render('my-work/index', [
            'items' => $items->all(),
            'filters' => ['view' => $view, 'search' => $search, 'type' => $type],
            'teamView' => $teamView,
            'stats' => [
                'open' => $items->count(),
                'overdue' => $items->where('overdue', true)->count(),
                'today' => $items->filter(fn (array $item) => $item['due_at'] && str_starts_with($item['due_at'], $today->toDateString()))->count(),
                'upcoming' => $items->filter(fn (array $item) => $item['due_at'] && $item['due_at'] > $today->toDateString() && ! $item['overdue'])->count(),
            ],
        ]);
    }

    private function applyDateFilter(Builder $query, string $view, string $column, $today): void
    {
        $cutoff = $column === 'scheduled_at' ? now() : $today;
        $query->when($view === 'overdue', fn (Builder $q) => $q->where($column, '<', $cutoff))
            ->when($view === 'today', fn (Builder $q) => $q->whereDate($column, $today))
            ->when($view === 'upcoming', fn (Builder $q) => $q->where($column, '>', $cutoff));
    }
}
