<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public const STATUSES = ['pending', 'paid', 'failed', 'refunded', 'void'];
    public const METHODS = ['bank_transfer', 'card', 'cash', 'online', 'other'];

    protected $fillable = ['subscription_id', 'invoice_number', 'amount', 'currency', 'status', 'method', 'due_at', 'paid_at', 'reference', 'notes'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'due_at' => 'date', 'paid_at' => 'date'];
    }

    public function subscription(): BelongsTo { return $this->belongsTo(Subscription::class); }
    public function renewal(): HasOne { return $this->hasOne(SubscriptionRenewal::class); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;
        return $query->where(function (Builder $query) use ($term): void {
            $query->where('invoice_number', 'like', "%{$term}%")
                ->orWhere('reference', 'like', "%{$term}%")
                ->orWhere('status', 'like', "%{$term}%")
                ->orWhereHas('subscription', fn (Builder $q) => $q->whereHas('applicationInstance', fn (Builder $instance) => $instance->where('name', 'like', "%{$term}%"))->orWhereHas('plan', fn (Builder $plan) => $plan->where('name', 'like', "%{$term}%")));
        });
    }

    public function activityDescription(string $event): ?string
    {
        return "Payment {$this->invoice_number} {$event}";
    }
}
