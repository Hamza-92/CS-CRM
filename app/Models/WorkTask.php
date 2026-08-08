<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class WorkTask extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;
    public const STATUSES = ['open', 'in_progress', 'completed', 'cancelled'];
    public const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    protected $fillable = ['customer_id', 'application_instance_id', 'support_ticket_id', 'assigned_to_id', 'created_by_id', 'task_number', 'title', 'description', 'priority', 'status', 'due_at', 'completed_at'];
    protected function casts(): array { return ['due_at' => 'date', 'completed_at' => 'datetime']; }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function applicationInstance(): BelongsTo { return $this->belongsTo(ApplicationInstance::class); }
    public function supportTicket(): BelongsTo { return $this->belongsTo(SupportTicket::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to_id'); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_id'); }
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;
        return $query->where(function (Builder $query) use ($term): void {
            $query->where('task_number', 'like', "%{$term}%")->orWhere('title', 'like', "%{$term}%")->orWhere('description', 'like', "%{$term}%")
                ->orWhereHas('customer', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('applicationInstance', fn (Builder $q) => $q->where('name', 'like', "%{$term}%"));
        });
    }
    public function isOverdue(): bool { return $this->due_at !== null && $this->due_at->isPast() && ! in_array($this->status, ['completed', 'cancelled'], true); }
    public function activityDescription(string $event): ?string { return "Task {$this->task_number} {$event}"; }
}
