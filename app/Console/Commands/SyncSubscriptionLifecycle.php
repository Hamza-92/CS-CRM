<?php

namespace App\Console\Commands;

use App\Models\ApplicationInstance;
use App\Models\Subscription;
use App\Notifications\CrmNotification;
use App\Services\CounterPos\TenantAccessLifecycleService;
use App\Support\Audit\ActivityLogger;
use Illuminate\Console\Command;
use Throwable;

class SyncSubscriptionLifecycle extends Command
{
    protected $signature = 'crm:sync-subscriptions';

    protected $description = 'Update subscription lifecycle states and reconcile CounterPOS tenant access.';

    public function handle(ActivityLogger $logger, TenantAccessLifecycleService $access): int
    {
        $expired = 0;
        $graceStarted = 0;
        $synchronized = 0;
        $failed = 0;

        Subscription::query()
            ->whereIn('status', ['trialing', 'active', 'past_due', 'paused'])
            ->whereDate('ends_at', '<', today())
            ->with('applicationInstance.customer.owner')
            ->chunkById(100, function ($subscriptions) use (&$expired, &$graceStarted, $logger): void {
                foreach ($subscriptions as $subscription) {
                    $previousStatus = $subscription->status;
                    $inGrace = $subscription->grace_ends_at?->greaterThanOrEqualTo(today()) === true;
                    $subscription->update(['status' => $inGrace ? 'past_due' : 'expired']);
                    $logger->log($inGrace ? 'subscription.grace_started' : 'subscription.expired', $subscription, $inGrace ? 'Subscription entered grace period automatically' : 'Subscription expired automatically', [
                        'previous_status' => $previousStatus,
                        'ends_at' => $subscription->ends_at?->toDateString(),
                        'grace_ends_at' => $subscription->grace_ends_at?->toDateString(),
                    ]);

                    if ($inGrace) {
                        $graceStarted++;

                        continue;
                    }

                    $owner = $subscription->applicationInstance?->customer?->owner;
                    $owner?->notify(new CrmNotification(
                        'Subscription expired',
                        "The subscription for {$subscription->applicationInstance?->name} has expired.",
                        'warning',
                        "/subscriptions/{$subscription->id}",
                    ));
                    $expired++;
                }
            });

        ApplicationInstance::withTrashed()
            ->whereNotNull('counterpos_tenant_id')
            ->orderBy('id')
            ->chunkById(100, function ($instances) use ($access, &$synchronized, &$failed): void {
                foreach ($instances as $instance) {
                    try {
                        if ($access->sync($instance) !== null) {
                            $synchronized++;
                        }
                    } catch (Throwable $exception) {
                        report($exception);
                        $failed++;
                        $this->error("Could not synchronize CounterPOS access for instance {$instance->id}: {$exception->getMessage()}");
                    }
                }
            });

        $this->info("Lifecycle updated: {$graceStarted} entered grace, {$expired} expired.");
        $this->info("CounterPOS access synchronized: {$synchronized}; failed: {$failed}.");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
