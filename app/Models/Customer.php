<?php

namespace App\Models;

use App\Enums\LeadSource;
use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name', 'business', 'phone', 'whatsapp', 'email', 'city', 'source', 'status',
        'owner_id', 'tags', 'notes', 'last_contacted_at', 'converted_from_lead_id',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'last_contacted_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'customer_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ApplicationInstance::class);
    }

    public function activityDescription(string $event): ?string
    {
        return "Customer {$this->name} {$event}";
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

    public function sourceLabel(): ?string
    {
        return $this->source ? (LeadSource::tryFrom($this->source)?->label() ?? ucfirst($this->source)) : null;
    }
}
