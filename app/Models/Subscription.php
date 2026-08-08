<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public const KINDS = ['trial', 'subscription'];
    public const STATUSES = ['trialing', 'active', 'past_due', 'paused', 'expired', 'cancelled'];

    protected $fillable = [
        'application_instance_id', 'plan_id', 'kind', 'status', 'starts_at', 'ends_at', 'renewal_at',
        'grace_ends_at', 'cancelled_at', 'auto_renew', 'external_reference', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date', 'ends_at' => 'date', 'renewal_at' => 'date', 'grace_ends_at' => 'date',
            'cancelled_at' => 'date', 'auto_renew' => 'boolean',
        ];
    }

    public function applicationInstance(): BelongsTo { return $this->belongsTo(ApplicationInstance::class); }
    public function plan(): BelongsTo { return $this->belongsTo(Plan::class); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;
        return $query->where(function (Builder $query) use ($term): void {
            $query->where('external_reference', 'like', "%{$term}%")
                ->orWhere('status', 'like', "%{$term}%")
                ->orWhereHas('applicationInstance', fn (Builder $q) => $q->where('name', 'like', "%{$term}%"))
                ->orWhereHas('plan', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('code', 'like', "%{$term}%"))
                ->orWhereHas('applicationInstance.customer', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"));
        });
    }

    public function isExpired(): bool
    {
        return $this->ends_at !== null && $this->ends_at->isPast() && ! in_array($this->status, ['cancelled', 'expired'], true);
    }

    public function daysRemaining(): ?int
    {
        return $this->ends_at ? today()->diffInDays($this->ends_at, false) : null;
    }

    public function activityDescription(string $event): ?string
    {
        return "Subscription for {$this->applicationInstance?->name} {$event}";
    }
}
