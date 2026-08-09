<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SubscriptionRenewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id', 'plan_id', 'payment_id', 'created_by_id', 'previous_status', 'status',
        'previous_ends_at', 'starts_at', 'ends_at', 'amount', 'currency', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'previous_ends_at' => 'date',
            'starts_at' => 'date',
            'ends_at' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function subscription(): BelongsTo { return $this->belongsTo(Subscription::class); }
    public function plan(): BelongsTo { return $this->belongsTo(Plan::class); }
    public function payment(): BelongsTo { return $this->belongsTo(Payment::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_id'); }
}
