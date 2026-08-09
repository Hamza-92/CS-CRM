<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Notifications\CrmNotification;
use App\Support\Audit\ActivityLogger;
use Illuminate\Console\Command;

class SyncSubscriptionLifecycle extends Command
{
    protected $signature = 'crm:sync-subscriptions';
    protected $description = 'Expire subscriptions whose end date has passed.';

    public function handle(ActivityLogger $logger): int
    {
        $expired = 0;
        Subscription::query()
            ->whereIn('status', ['trialing', 'active', 'past_due', 'paused'])
            ->whereDate('ends_at', '<', today())
            ->with('applicationInstance.customer.owner')
            ->chunkById(100, function ($subscriptions) use (&$expired, $logger): void {
                foreach ($subscriptions as $subscription) {
                    $subscription->update(['status' => 'expired']);
                    $logger->log('subscription.expired', $subscription, 'Subscription expired automatically', [
                        'previous_status' => $subscription->getRawOriginal('status'),
                        'ends_at' => $subscription->ends_at?->toDateString(),
                    ]);
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

        $this->info("Expired {$expired} subscription(s).");
        return self::SUCCESS;
    }
}
