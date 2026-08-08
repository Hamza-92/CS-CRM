<?php

namespace App\Models;

use App\Enums\LeadStatus;
use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name', 'business', 'phone', 'whatsapp', 'email', 'city', 'source', 'status',
        'owner_id', 'interested_products', 'next_follow_up_at', 'notes', 'customer_id', 'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'interested_products' => 'array',
            'next_follow_up_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class);
    }

    public function statusDefinition(): BelongsTo
    {
        return $this->belongsTo(LeadStatusOption::class, 'status', 'slug');
    }

    public function sourceDefinition(): BelongsTo
    {
        return $this->belongsTo(LeadSourceOption::class, 'source', 'slug');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;

        return $query->where(function (Builder $query) use ($term): void {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('business', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('whatsapp', 'like', "%{$term}%");
        });
    }

    public function statusLabel(): string
    {
        return $this->statusDefinition?->name ?? LeadStatus::tryFrom($this->status)?->label() ?? ucfirst(str_replace('_', ' ', $this->status));
    }

    public function activityDescription(string $event): ?string
    {
        return "Lead {$this->name} {$event}";
    }
}
