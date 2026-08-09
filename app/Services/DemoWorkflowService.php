<?php

namespace App\Services;

use App\Models\ApplicationInstance;
use App\Models\Lead;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use App\Models\WorkTask;
use App\Notifications\CrmNotification;
use App\Support\Audit\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoWorkflowService
{
    public function __construct(private readonly AssignmentRouter $router) {}
    public function requestDemo(Lead $lead, User $requester, ActivityLogger $logger): void
    {
        $lead->loadMissing(['owner', 'customer']);
        $products = Product::query()
            ->active()
            ->whereIn('id', $lead->interested_products ?? [])
            ->orderBy('name')
            ->get();

        // A lead without a selected product still needs a visible handoff task.
        $productRows = $products->isEmpty() ? collect([null]) : $products;
        $createdTasks = [];

        DB::transaction(function () use ($lead, $requester, $logger, $productRows, &$createdTasks): void {
            foreach ($productRows as $product) {
                $key = $this->automationKey($lead, $product);
                if (WorkTask::query()->where('automation_key', $key)->exists()) {
                    continue;
                }

                $assignee = $this->router->forDemoProduct($product);
                $title = $product instanceof Product
                    ? "Setup {$product->name} Demo"
                    : "Setup Demo for {$lead->name}";
                $description = trim(collect([
                    "Automated demo handoff for lead {$lead->name}.",
                    $lead->business ? "Business: {$lead->business}." : null,
                    $product?->demo_notes,
                    'Record the demo URL, instance details, setup date and trial duration when complete.',
                ])->filter()->join("\n\n"));

                $task = WorkTask::create([
                    'customer_id' => $lead->customer_id,
                    'lead_id' => $lead->id,
                    'product_id' => $product?->id,
                    'assigned_to_id' => $assignee?->id,
                    'created_by_id' => $requester->id,
                    'task_number' => $this->nextTaskNumber(),
                    'title' => $title,
                    'description' => $description,
                    'priority' => 'high',
                    'status' => 'open',
                    'due_at' => today()->addDays(2),
                    'automation_key' => $key,
                ]);

                $createdTasks[] = $task;
                $this->notify($assignee, 'Demo setup assigned', "{$task->task_number}: {$task->title} is ready for setup.", 'info', $task);
            }
        });

        if ($createdTasks === []) {
            return;
        }

        $logger->log('lead.demo_requested', $lead, "Demo setup requested for {$lead->name}", [
            'task_ids' => collect($createdTasks)->pluck('id')->values()->all(),
            'product_ids' => collect($createdTasks)->pluck('product_id')->filter()->values()->all(),
        ], $requester->id);

        $message = count($createdTasks) === 1
            ? "A demo setup task was created for {$lead->name}."
            : count($createdTasks).' demo setup tasks were created for '.$lead->name.'.';
        $this->notify($requester, 'Demo setup requested', $message, 'info', $createdTasks[0]);
    }

    public function completeDemoTask(WorkTask $task, User $completer, ActivityLogger $logger): void
    {
        if (! Str::startsWith((string) $task->automation_key, 'demo_setup:')) {
            return;
        }

        $task->loadMissing(['lead.owner', 'product', 'customer', 'assignedTo']);
        $lead = $task->lead;
        $product = $task->product;
        if (! $lead || ! $product) {
            return;
        }

        if (! $lead->customer_id || ! $task->customer) {
            $this->notify($lead->owner, 'Demo setup completed', "{$task->task_number} is complete. Convert {$lead->name} to a customer to start its trial.", 'warning', $task);
            $logger->log('lead.demo_completed', $lead, "Demo setup completed for {$lead->name}; customer handoff is required", [
                'task_id' => $task->id,
                'product_id' => $product->id,
                'requires_customer_conversion' => true,
            ], $completer->id);

            return;
        }

        $instance = ApplicationInstance::query()->firstOrCreate(
            [
                'customer_id' => $lead->customer_id,
                'product_id' => $product->id,
                'environment' => 'demo',
                'name' => "{$product->name} Demo - {$task->customer->name}",
            ],
            [
                'owner_id' => $completer->id,
                'status' => 'active',
                'notes' => "Created from {$task->task_number}.",
                'deployed_at' => today(),
            ],
        );
        if ($instance->status !== 'active' || $instance->owner_id !== $completer->id) {
            $instance->update(['status' => 'active', 'owner_id' => $completer->id]);
        }

        $plan = Plan::query()
            ->where('product_id', $product->id)
            ->active()
            ->where('billing_cycle', 'trial')
            ->orderBy('sort_order')
            ->first();

        if (! $plan) {
            $this->notify($lead->owner, 'Demo ready for trial handoff', "{$task->task_number} is complete, but {$product->name} has no active trial plan yet.", 'warning', $task);
            $logger->log('lead.demo_completed', $lead, "Demo setup completed for {$lead->name}; trial plan is required", [
                'task_id' => $task->id,
                'product_id' => $product->id,
                'application_instance_id' => $instance->id,
                'requires_trial_plan' => true,
            ], $completer->id);

            return;
        }

        $subscription = Subscription::query()
            ->where('application_instance_id', $instance->id)
            ->whereIn('status', ['trialing', 'active'])
            ->first();
        if (! $subscription) {
            $duration = $plan->duration_days ?? $plan->billing_cycle->defaultDurationDays() ?? $product->default_trial_days ?? 14;
            Subscription::create([
                'application_instance_id' => $instance->id,
                'plan_id' => $plan->id,
                'kind' => 'trial',
                'status' => 'trialing',
                'starts_at' => today(),
                'ends_at' => today()->addDays($duration),
                'renewal_at' => today()->addDays($duration),
                'auto_renew' => false,
                'notes' => "Started by {$task->task_number}.",
            ]);
        }

        $oldStatus = $lead->status;
        if ($oldStatus !== 'trial_running') {
            $lead->update(['status' => 'trial_running']);
        }
        $logger->log('lead.trial_started', $lead, "Trial started for {$lead->name}", [
            'task_id' => $task->id,
            'product_id' => $product->id,
            'application_instance_id' => $instance->id,
            'plan_id' => $plan->id,
            'old_status' => $oldStatus,
            'new_status' => 'trial_running',
        ], $completer->id);

        $this->notify($lead->owner, 'Trial started', "{$lead->name} is now in trial for {$product->name}.", 'success', $task);
        if ($lead->owner_id !== $completer->id) {
            $this->notify($completer, 'Trial started', "The trial for {$lead->name} is now running.", 'success', $task);
        }
    }

    private function automationKey(Lead $lead, ?Product $product): string
    {
        return "demo_setup:{$lead->id}:".($product?->id ?? 'none');
    }

    private function nextTaskNumber(): string
    {
        return 'TSK-'.now()->format('Y').'-'.str_pad((string) (WorkTask::withTrashed()->max('id') + 1), 5, '0', STR_PAD_LEFT);
    }

    private function notify(?User $user, string $title, string $message, string $tone, WorkTask $task): void
    {
        $user?->notify(new CrmNotification($title, $message, $tone, "/tasks/{$task->id}", [
            'automation' => 'demo_workflow',
            'task_id' => $task->id,
        ]));
    }
}
