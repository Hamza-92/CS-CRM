<?php

namespace App\Console\Commands;

use App\Enums\RoleName;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\WorkTask;
use App\Notifications\CrmNotification;
use App\Services\AssignmentRouter;
use App\Support\Audit\ActivityLogger;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RunCrmAutomations extends Command
{
    protected $signature = 'crm:run-automations';
    protected $description = 'Run idempotent CRM reminders, routing and operational follow-up rules.';

    public function handle(AssignmentRouter $router, ActivityLogger $logger): int
    {
        $today = CarbonImmutable::today();
        $notifications = 0;
        $tasks = 0;

        Subscription::query()
            ->whereIn('status', ['trialing', 'active', 'past_due', 'paused'])
            ->whereNotNull('ends_at')
            ->whereDate('ends_at', '<=', $today->addDays(7))
            ->with(['applicationInstance.customer.owner', 'applicationInstance.product', 'plan'])
            ->chunkById(100, function ($subscriptions) use (&$notifications, &$tasks, $today, $router, $logger): void {
                foreach ($subscriptions as $subscription) {
                    $instance = $subscription->applicationInstance;
                    $customer = $instance?->customer;
                    $owner = $customer?->owner;
                    $endsAt = $subscription->ends_at;
                    if (! $endsAt) continue;

                    $inGrace = $endsAt->isBefore($today) && $subscription->grace_ends_at?->isSameOrAfter($today);
                    if ($inGrace && $subscription->status !== 'past_due') {
                        $oldStatus = $subscription->status;
                        $subscription->update(['status' => 'past_due']);
                        $logger->log('subscription.grace_started', $subscription, 'Subscription entered grace period automatically', [
                            'old_status' => $oldStatus,
                            'grace_ends_at' => $subscription->grace_ends_at?->toDateString(),
                        ]);
                    }

                    $daysRemaining = $today->diffInDays($endsAt, false);
                    if ($daysRemaining >= 0 && $daysRemaining <= 7) {
                        $label = $subscription->kind === 'trial' ? 'Trial ending soon' : 'Subscription expiring soon';
                        $message = "{$instance?->name} ends on {$endsAt->toDateString()}.";
                        foreach ($this->recipients($owner) as $recipient) {
                            if ($this->notifyOnce($recipient, "subscription:{$subscription->id}:expiring:{$today->toDateString()}:{$recipient->id}", $label, $message, 'warning', "/subscriptions/{$subscription->id}")) $notifications++;
                        }

                        if ($subscription->kind === 'trial' && $daysRemaining <= 3) {
                            $assignee = $router->forFollowUp(['customer_id' => $customer?->id, 'application_instance_id' => $instance?->id]);
                            if ($this->createTaskOnce($subscription->id, "trial_expiry:{$subscription->id}:{$endsAt->toDateString()}", $assignee, $customer?->id, $instance?->id, $instance?->product_id, 'Confirm trial outcome', "Confirm whether {$customer?->name} will convert before the trial ends on {$endsAt->toDateString()}.", $logger)) $tasks++;
                        }
                    }

                    if ($inGrace) {
                        foreach ($this->recipients($owner) as $recipient) {
                            if ($this->notifyOnce($recipient, "subscription:{$subscription->id}:grace:{$today->toDateString()}:{$recipient->id}", 'Subscription in grace period', "{$instance?->name} is in grace until {$subscription->grace_ends_at?->toDateString()}.", 'bad', "/subscriptions/{$subscription->id}")) $notifications++;
                        }
                    }
                }
            });

        Payment::query()
            ->whereIn('status', ['pending', 'partially_paid'])
            ->whereNotNull('due_at')
            ->whereDate('due_at', '<=', $today)
            ->with(['subscription.applicationInstance.customer.owner', 'subscription.applicationInstance.product'])
            ->chunkById(100, function ($payments) use (&$notifications, &$tasks, $today, $router, $logger): void {
                foreach ($payments as $payment) {
                    $instance = $payment->subscription?->applicationInstance;
                    $customer = $instance?->customer;
                    $owner = $customer?->owner;
                    $recipients = $this->recipients($owner);
                    foreach ($recipients as $recipient) {
                        if ($this->notifyOnce($recipient, "payment:{$payment->id}:overdue:{$today->toDateString()}:{$recipient->id}", 'Payment overdue', "Payment {$payment->invoice_number} requires follow-up.", 'bad', "/payments/{$payment->id}")) $notifications++;
                    }

                    $assignee = $this->accountsAssignee($owner);
                    if ($this->createTaskOnce($payment->id, "payment_overdue:{$payment->id}", $assignee, $customer?->id, $instance?->id, $instance?->product_id, 'Follow up overdue payment', "Follow up payment {$payment->invoice_number} for {$customer?->name}.", $logger)) $tasks++;
                }
            });

        SupportTicket::query()
            ->whereNotIn('status', ['resolved', 'closed'])
            ->whereNotNull('due_at')
            ->whereDate('due_at', '<', $today)
            ->with(['assignedTo', 'customer.owner', 'applicationInstance.product'])
            ->chunkById(100, function ($tickets) use (&$notifications, $today): void {
                foreach ($tickets as $ticket) {
                    $recipient = $ticket->assignedTo ?: $ticket->customer?->owner;
                    if ($recipient && $this->notifyOnce($recipient, "ticket:{$ticket->id}:overdue:{$today->toDateString()}:{$recipient->id}", 'Support ticket overdue', "{$ticket->ticket_number} is overdue and needs attention.", 'bad', "/support-tickets/{$ticket->id}")) $notifications++;
                }
            });

        $this->info("CRM automations completed: {$notifications} notification(s), {$tasks} task(s) created.");
        return self::SUCCESS;
    }

    /** @return array<int, User> */
    private function recipients(?User $owner): array
    {
        $users = collect($owner?->is_active ? [$owner] : []);
        $users = $users->merge(User::query()->active()->role(RoleName::Accounts->value)->orderBy('id')->limit(2)->get());
        return $users->unique('id')->values()->all();
    }

    private function accountsAssignee(?User $owner): ?User
    {
        return User::query()->active()->role(RoleName::Accounts->value)->orderBy('id')->first()
            ?? ($owner?->is_active ? $owner : null);
    }

    private function notifyOnce(User $recipient, string $key, string $title, string $message, string $tone, string $url): bool
    {
        $exists = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $recipient->id)
            ->whereJsonContains('data->meta->automation_key', $key)
            ->exists();
        if ($exists) return false;
        $recipient->notify(new CrmNotification($title, $message, $tone, $url, ['automated' => true, 'automation_key' => $key]));
        return true;
    }

    private function createTaskOnce(int $recordId, string $key, ?User $assignee, ?int $customerId, ?int $instanceId, ?int $productId, string $title, string $description, ActivityLogger $logger): bool
    {
        if (WorkTask::query()->where('automation_key', $key)->exists()) return false;
        $task = WorkTask::create([
            'customer_id' => $customerId,
            'application_instance_id' => $instanceId,
            'product_id' => $productId,
            'assigned_to_id' => $assignee?->id,
            'task_number' => 'TSK-'.now()->format('Y').'-'.str_pad((string) (WorkTask::withTrashed()->max('id') + 1), 5, '0', STR_PAD_LEFT),
            'title' => $title,
            'description' => $description,
            'priority' => 'high',
            'status' => 'open',
            'due_at' => today()->addDay(),
            'automation_key' => $key,
        ]);
        $logger->log('automation.task_created', $task, "Automated task created: {$task->title}", ['automation_key' => $key, 'source_id' => $recordId]);
        if ($assignee) $assignee->notify(new CrmNotification('Automated task assigned', "{$task->task_number}: {$task->title}.", 'info', "/tasks/{$task->id}", ['automated' => true, 'automation_key' => $key]));
        return true;
    }
}
