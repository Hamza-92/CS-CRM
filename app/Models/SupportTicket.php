<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
    public const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    public const CATEGORIES = ['general', 'bug', 'question', 'feature_request', 'billing', 'access'];

    protected $fillable = ['customer_id', 'application_instance_id', 'assigned_to_id', 'created_by_id', 'ticket_number', 'subject', 'description', 'category', 'priority', 'status', 'due_at', 'waiting_at', 'reopened_at', 'resolved_at', 'resolved_by_id', 'resolution_notes', 'closed_at'];

    protected function casts(): array { return ['due_at' => 'date', 'waiting_at' => 'datetime', 'reopened_at' => 'datetime', 'resolved_at' => 'datetime', 'closed_at' => 'datetime']; }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function applicationInstance(): BelongsTo { return $this->belongsTo(ApplicationInstance::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to_id'); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_id'); }
    public function resolvedBy(): BelongsTo { return $this->belongsTo(User::class, 'resolved_by_id'); }
    public function tasks(): HasMany { return $this->hasMany(WorkTask::class); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;
        return $query->where(function (Builder $query) use ($term): void {
            $query->where('ticket_number', 'like', "%{$term}%")
                ->orWhere('subject', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhereHas('customer', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('applicationInstance', fn (Builder $q) => $q->where('name', 'like', "%{$term}%"));
        });
    }

    public function isOverdue(): bool { return $this->due_at !== null && $this->due_at->isPast() && ! in_array($this->status, ['resolved', 'closed'], true); }
    public function activityDescription(string $event): ?string { return "Ticket {$this->ticket_number} {$event}"; }
}
