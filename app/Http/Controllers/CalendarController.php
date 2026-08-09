<?php

namespace App\Http\Controllers;

use App\Models\FollowUp;
use App\Models\WorkTask;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $canTasks = $request->user()->can('viewAny', WorkTask::class);
        $canFollowUps = $request->user()->can('viewAny', FollowUp::class);
        abort_unless($canTasks || $canFollowUps, 403);

        $monthInput = $request->string('month')->toString();
        $month = CarbonImmutable::today()->startOfMonth();
        if (preg_match('/^\d{4}-\d{2}$/', $monthInput)) {
            try {
                $parsed = CarbonImmutable::createFromFormat('!Y-m', $monthInput);
                if ($parsed && $parsed->format('Y-m') === $monthInput) $month = $parsed;
            } catch (\Throwable) {
                // Keep the current month when a malformed month is supplied.
            }
        }
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();

        $events = collect();
        if ($canTasks) {
            $events = $events->merge(WorkTask::query()
                ->whereBetween('due_at', [$start->toDateString(), $end->toDateString()])
                ->orderBy('due_at')
                ->get(['id', 'title', 'task_number', 'status', 'priority', 'due_at'])
                ->map(fn (WorkTask $task): array => [
                    'id' => "task-{$task->id}",
                    'type' => 'Task',
                    'title' => $task->title,
                    'detail' => $task->task_number,
                    'date' => $task->due_at?->toDateString(),
                    'href' => "/tasks/{$task->id}",
                    'status' => Str::headline($task->status),
                    'tone' => $task->isOverdue() ? 'bad' : ($task->status === 'completed' ? 'ok' : 'brand'),
                ]));
        }
        if ($canFollowUps) {
            $events = $events->merge(FollowUp::query()
                ->whereBetween('scheduled_at', [$start->startOfDay(), $end->endOfDay()])
                ->orderBy('scheduled_at')
                ->with(['lead:id,name', 'customer:id,name'])
                ->get(['id', 'reason', 'status', 'scheduled_at', 'lead_id', 'customer_id'])
                ->map(fn (FollowUp $followUp): array => [
                    'id' => "follow-up-{$followUp->id}",
                    'type' => 'Follow-up',
                    'title' => $followUp->reason,
                    'detail' => $followUp->subjectName(),
                    'date' => $followUp->scheduled_at?->toDateString(),
                    'href' => '/follow-ups',
                    'status' => Str::headline($followUp->status),
                    'tone' => $followUp->isOverdue() ? 'bad' : ($followUp->status === 'completed' ? 'ok' : 'info'),
                ]));
        }

        return Inertia::render('calendar/index', [
            'month' => $start->format('Y-m'),
            'monthLabel' => $start->format('F Y'),
            'previousMonth' => $start->subMonth()->format('Y-m'),
            'nextMonth' => $start->addMonth()->format('Y-m'),
            'todayMonth' => CarbonImmutable::today()->format('Y-m'),
            'events' => $events->sortBy(['date', 'type'])->values()->all(),
            'summary' => [
                'tasks' => $events->where('type', 'Task')->count(),
                'followUps' => $events->where('type', 'Follow-up')->count(),
                'overdue' => $events->where('tone', 'bad')->count(),
            ],
            'can' => ['tasks' => $canTasks, 'followUps' => $canFollowUps],
        ]);
    }
}
