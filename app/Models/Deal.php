<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deal extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'title', 'lead_id', 'customer_id', 'product_id', 'plan_id', 'stage_id', 'owner_id',
        'amount', 'currency', 'probability', 'expected_close_date', 'next_step', 'notes',
        'loss_reason', 'won_at', 'lost_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'probability' => 'integer',
            'expected_close_date' => 'date',
            'won_at' => 'datetime',
            'lost_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function plan(): BelongsTo { return $this->belongsTo(Plan::class); }
    public function stage(): BelongsTo { return $this->belongsTo(DealStage::class, 'stage_id'); }
    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_id'); }
    public function followUps(): HasMany { return $this->hasMany(FollowUp::class); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;

        return $query->where(function (Builder $query) use ($term): void {
            $query->where('title', 'like', "%{$term}%")
                ->orWhereHas('lead', fn (Builder $lead) => $lead->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('customer', fn (Builder $customer) => $customer->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('product', fn (Builder $product) => $product->where('name', 'like', "%{$term}%"));
        });
    }

    public function contactName(): string
    {
        return $this->customer?->name ?? $this->lead?->name ?? 'Unlinked contact';
    }

    public function activityDescription(string $event): ?string
    {
        return "Deal {$this->title} {$event}";
    }
}
