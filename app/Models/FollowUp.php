<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class FollowUp extends Model
{
    use HasFactory, LogsActivity;

    public const STATUSES = ['pending', 'completed', 'rescheduled', 'cancelled'];

    protected $fillable = [
        'lead_id', 'customer_id', 'deal_id', 'application_instance_id', 'reason', 'notes', 'owner_id', 'scheduled_at', 'status',
        'completed_at', 'completed_by_id', 'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function deal(): BelongsTo { return $this->belongsTo(Deal::class); }
    public function applicationInstance(): BelongsTo { return $this->belongsTo(ApplicationInstance::class); }
    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_id'); }
    public function completedBy(): BelongsTo { return $this->belongsTo(User::class, 'completed_by_id'); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_id'); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;

        return $query->where(function (Builder $query) use ($term): void {
            $query->where('reason', 'like', "%{$term}%")
                ->orWhere('notes', 'like', "%{$term}%")
                ->orWhereHas('lead', fn (Builder $lead) => $lead->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('customer', fn (Builder $customer) => $customer->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('applicationInstance', fn (Builder $instance) => $instance->where('name', 'like', "%{$term}%"));
        });
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereIn('status', ['pending', 'rescheduled'])->where('scheduled_at', '<', now());
    }

    public function isOverdue(): bool
    {
        return in_array($this->status, ['pending', 'rescheduled'], true) && $this->scheduled_at?->isPast();
    }

    public function subjectName(): string
    {
        return $this->deal?->title ?? $this->lead?->name ?? $this->customer?->name ?? $this->applicationInstance?->name ?? 'Unlinked record';
    }

    public function activityDescription(string $event): ?string
    {
        return "Follow-up {$this->reason} {$event}";
    }
}
