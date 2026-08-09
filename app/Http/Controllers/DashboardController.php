<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Activity;
use App\Models\Customer;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\LeadStatusOption;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\WorkTask;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $can = static fn (Permission $permission): bool => $user->can($permission->value);
        $today = CarbonImmutable::today();
        $period = (int) $request->integer('period', 180);
        $period = in_array($period, [30, 90, 180], true) ? $period : 180;

        $stats = [
            'customers' => $can(Permission::ViewCustomers) ? Customer::query()->where('status', 'active')->count() : null,
            'leads' => $can(Permission::ViewLeads) ? Lead::query()->count() : null,
            'trials' => $can(Permission::ViewSubscriptions)
                ? Subscription::query()->where('kind', 'trial')->where('status', 'trialing')->count()
                : null,
            'subscriptions' => $can(Permission::ViewSubscriptions)
                ? Subscription::query()->where('kind', 'subscription')->where('status', 'active')->count()
                : null,
            'expiring' => $can(Permission::ViewSubscriptions)
                ? Subscription::query()
                    ->whereNotIn('status', ['cancelled', 'expired'])
                    ->whereBetween('ends_at', [$today, $today->addDays(7)])
                    ->count()
                : null,
            'grace' => $can(Permission::ViewSubscriptions)
                ? Subscription::query()
                    ->whereNotIn('status', ['cancelled', 'expired'])
                    ->whereDate('ends_at', '<', $today)
                    ->whereDate('grace_ends_at', '>=', $today)
                    ->count()
                : null,
            'overduePayments' => $can(Permission::ViewPayments)
                ? Payment::query()->where('status', 'pending')->whereDate('due_at', '<', $today)->count()
                : null,
            'openTickets' => $can(Permission::ViewSupportTickets)
                ? SupportTicket::query()->whereNotIn('status', ['resolved', 'closed'])->count()
                : null,
            'overdueTasks' => $can(Permission::ViewTasks)
                ? WorkTask::query()->whereIn('status', ['open', 'in_progress'])->whereDate('due_at', '<', $today)->count()
                : null,
            'followUpsToday' => $can(Permission::ViewFollowUps)
                ? FollowUp::query()->whereIn('status', ['pending', 'rescheduled'])->whereBetween('scheduled_at', [$today, $today->endOfDay()])->count()
                : null,
            'overdueFollowUps' => $can(Permission::ViewFollowUps) ? FollowUp::query()->overdue()->count() : null,
            'products' => $can(Permission::ViewProducts) ? Product::query()->active()->count() : null,
            'plans' => $can(Permission::ViewPlans) ? Plan::query()->active()->count() : null,
            'users' => $can(Permission::ViewUsers) ? User::query()->active()->count() : null,
        ];

        $pipeline = [];
        if ($can(Permission::ViewLeads)) {
            $statusCounts = Lead::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
            $statusOptions = LeadStatusOption::query()->active()->orderBy('sort_order')->get(['name', 'slug', 'color']);
            $pipeline = $statusOptions->map(fn (LeadStatusOption $option): array => [
                'label' => $option->name,
                'value' => (int) ($statusCounts[$option->slug] ?? 0),
                'color' => $option->color,
            ])->values()->all();
        }

        $subscriptionMix = [];
        if ($can(Permission::ViewSubscriptions)) {
            $subscriptionMix = Subscription::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->get()
                ->map(fn (Subscription $subscription): array => [
                    'label' => str_replace('_', ' ', ucfirst($subscription->status)),
                    'value' => (int) $subscription->total,
                ])->values()->all();
        }

        $trend = ['labels' => [], 'customers' => [], 'leads' => [], 'payments' => []];
        $trendStart = $today->subDays($period - 1)->startOfDay();
        $bucketDays = max(1, (int) floor($period / 6));
        for ($index = 0; $index < 6; $index++) {
            $start = $trendStart->addDays($index * $bucketDays);
            $end = $index === 5 ? $today->endOfDay() : $start->addDays($bucketDays - 1)->endOfDay();
            $trend['labels'][] = $start->format($period <= 90 ? 'M j' : 'M');
            $trend['customers'][] = $can(Permission::ViewCustomers) ? Customer::query()->whereBetween('created_at', [$start, $end])->count() : null;
            $trend['leads'][] = $can(Permission::ViewLeads) ? Lead::query()->whereBetween('created_at', [$start, $end])->count() : null;
            $trend['payments'][] = $can(Permission::ViewPayments) ? Payment::query()->where('status', 'paid')->whereBetween('paid_at', [$start, $end])->count() : null;
        }

        $paymentSummary = ['collected' => null, 'outstanding' => null, 'partiallyPaid' => null];
        if ($can(Permission::ViewPayments)) {
            $paymentSummary = [
                'collected' => (float) Payment::query()->where('status', 'paid')->sum('amount'),
                'outstanding' => (float) Payment::query()->whereIn('status', ['pending', 'partially_paid'])->sum('amount'),
                'partiallyPaid' => (float) Payment::query()->where('status', 'partially_paid')->sum('amount'),
            ];
        }

        $workload = [];
        if ($can(Permission::ViewUsers) && ($can(Permission::ViewTasks) || $can(Permission::ViewFollowUps) || $can(Permission::ViewSupportTickets))) {
            $workload = User::query()->active()->orderBy('name')->limit(8)->get(['id', 'name'])->map(function (User $owner) use ($can): array {
                return [
                    'label' => $owner->name,
                    'tasks' => $can(Permission::ViewTasks) ? WorkTask::query()->where('assigned_to_id', $owner->id)->whereIn('status', ['open', 'in_progress'])->count() : 0,
                    'followUps' => $can(Permission::ViewFollowUps) ? FollowUp::query()->where('owner_id', $owner->id)->whereIn('status', ['pending', 'rescheduled'])->count() : 0,
                    'tickets' => $can(Permission::ViewSupportTickets) ? SupportTicket::query()->where('assigned_to_id', $owner->id)->whereNotIn('status', ['resolved', 'closed'])->count() : 0,
                ];
            })->values()->all();
        }

        $renewals = [];
        if ($can(Permission::ViewSubscriptions)) {
            $renewals = Subscription::query()
                ->with('applicationInstance:id,name')
                ->whereNotIn('status', ['cancelled', 'expired'])
                ->whereBetween('renewal_at', [$today, $today->addDays(30)])
                ->orderBy('renewal_at')
                ->limit(6)
                ->get(['id', 'application_instance_id', 'status', 'renewal_at'])
                ->map(fn (Subscription $subscription): array => [
                    'id' => $subscription->id,
                    'name' => $subscription->applicationInstance?->name ?? 'Unnamed instance',
                    'status' => $subscription->status,
                    'renewal_at' => $subscription->renewal_at?->toDateString(),
                ])->values()->all();
        }

        $actionItems = collect();
        if ($can(Permission::ViewTasks)) {
            $actionItems = $actionItems->merge(WorkTask::query()->whereIn('status', ['open', 'in_progress'])->whereDate('due_at', '<', $today)->latest('due_at')->limit(4)->get()->map(fn (WorkTask $task): array => [
                'id' => "task-{$task->id}", 'type' => 'Task', 'title' => $task->title, 'detail' => $task->task_number, 'due_at' => $task->due_at?->toDateString(), 'href' => "/tasks/{$task->id}", 'tone' => 'bad',
            ]));
        }
        if ($can(Permission::ViewFollowUps)) {
            $actionItems = $actionItems->merge(FollowUp::query()->overdue()->latest('scheduled_at')->limit(4)->get()->map(fn (FollowUp $followUp): array => [
                'id' => "follow-up-{$followUp->id}", 'type' => 'Follow-up', 'title' => $followUp->reason, 'detail' => $followUp->subjectName(), 'due_at' => $followUp->scheduled_at?->toIso8601String(), 'href' => '/follow-ups', 'tone' => 'warn',
            ]));
        }
        if ($can(Permission::ViewPayments)) {
            $actionItems = $actionItems->merge(Payment::query()->where('status', 'pending')->whereDate('due_at', '<', $today)->with('subscription.applicationInstance')->latest('due_at')->limit(4)->get()->map(fn (Payment $payment): array => [
                'id' => "payment-{$payment->id}", 'type' => 'Payment', 'title' => $payment->invoice_number ?: 'Payment due', 'detail' => $payment->subscription?->applicationInstance?->name ?? 'Unlinked subscription', 'due_at' => $payment->due_at?->toDateString(), 'href' => "/payments/{$payment->id}", 'tone' => 'bad',
            ]));
        }
        if ($can(Permission::ViewSupportTickets)) {
            $actionItems = $actionItems->merge(SupportTicket::query()->whereNotIn('status', ['resolved', 'closed'])->whereDate('due_at', '<', $today)->latest('due_at')->limit(4)->get()->map(fn (SupportTicket $ticket): array => [
                'id' => "ticket-{$ticket->id}", 'type' => 'Ticket', 'title' => $ticket->subject, 'detail' => $ticket->ticket_number, 'due_at' => $ticket->due_at?->toDateString(), 'href' => "/support-tickets/{$ticket->id}", 'tone' => 'info',
            ]));
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'pipeline' => $pipeline,
            'subscriptionMix' => $subscriptionMix,
            'trend' => $trend,
            'period' => $period,
            'paymentSummary' => $paymentSummary,
            'workload' => $workload,
            'renewals' => $renewals,
            'actionItems' => $actionItems->sortBy('due_at')->take(8)->values()->all(),
            'recentActivity' => $can(Permission::ViewActivityLog)
                ? Activity::query()->with('user:id,name,avatar_path')->latest('created_at')->limit(10)->get()
                : [],
        ]);
    }
}
