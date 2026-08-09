<?php

namespace App\Console\Commands;

use App\Models\FollowUp;
use App\Models\User;
use App\Models\WorkTask;
use App\Notifications\CrmNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendCrmReminders extends Command
{
    protected $signature = 'crm:send-reminders';
    protected $description = 'Send daily reminders for due and overdue work.';

    public function handle(): int
    {
        $today = CarbonImmutable::today();
        $sent = 0;

        WorkTask::query()
            ->whereNotNull('assigned_to_id')
            ->whereIn('status', ['open', 'in_progress'])
            ->whereDate('due_at', '<=', $today)
            ->with('assignedTo:id,name,is_active')
            ->chunkById(100, function ($tasks) use (&$sent, $today): void {
                foreach ($tasks as $task) {
                    $recipient = $task->assignedTo;
                    if (! $recipient || ! $recipient->is_active) continue;
                    $overdue = $task->due_at?->isBefore($today);
                    $key = "task:{$task->id}:{$today->toDateString()}";
                    if ($this->remind($recipient, $key, $overdue ? 'Overdue task' : 'Task due today', $overdue ? "{$task->task_number} is overdue: {$task->title}." : "{$task->task_number} is due today: {$task->title}.", $overdue ? 'bad' : 'info', "/tasks/{$task->id}")) $sent++;
                }
            });

        FollowUp::query()
            ->whereNotNull('owner_id')
            ->whereIn('status', ['pending', 'rescheduled'])
            ->where('scheduled_at', '<=', $today->endOfDay())
            ->with(['owner:id,name,is_active', 'lead:id,name', 'customer:id,name'])
            ->chunkById(100, function ($followUps) use (&$sent, $today): void {
                foreach ($followUps as $followUp) {
                    $recipient = $followUp->owner;
                    if (! $recipient || ! $recipient->is_active) continue;
                    $overdue = $followUp->scheduled_at?->isBefore($today->startOfDay());
                    $key = "follow-up:{$followUp->id}:{$today->toDateString()}";
                    $subject = $followUp->subjectName();
                    if ($this->remind($recipient, $key, $overdue ? 'Overdue follow-up' : 'Follow-up due today', $overdue ? "{$followUp->reason} for {$subject} is overdue." : "{$followUp->reason} for {$subject} is scheduled today.", $overdue ? 'bad' : 'info', '/follow-ups')) $sent++;
                }
            });

        $this->info("Sent {$sent} reminder(s).");
        return self::SUCCESS;
    }

    private function remind(User $recipient, string $key, string $title, string $message, string $tone, string $url): bool
    {
        $alreadySent = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $recipient->getKey())
            ->whereDate('created_at', today())
            ->whereJsonContains('data->meta->reminder_key', $key)
            ->exists();

        if ($alreadySent) return false;
        $recipient->notify(new CrmNotification($title, $message, $tone, $url, ['automated' => true, 'reminder_key' => $key]));
        return true;
    }
}
