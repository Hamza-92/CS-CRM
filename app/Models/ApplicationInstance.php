<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class ApplicationInstance extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public const ENVIRONMENTS = ['demo', 'staging', 'production', 'sandbox'];
    public const STATUSES = ['planned', 'active', 'paused', 'retired'];

    protected $fillable = [
        'customer_id', 'product_id', 'owner_id', 'name', 'environment', 'status',
        'deployment_url', 'server_name', 'version', 'deployed_at', 'last_checked_at', 'notes',
    ];

    protected function casts(): array
    {
        return ['deployed_at' => 'date', 'last_checked_at' => 'datetime'];
    }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_id'); }
    public function followUps(): HasMany { return $this->hasMany(FollowUp::class); }
    public function subscriptions(): HasMany { return $this->hasMany(Subscription::class); }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) return $query;
        return $query->where(function (Builder $query) use ($term): void {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('environment', 'like', "%{$term}%")
                ->orWhere('status', 'like', "%{$term}%")
                ->orWhere('deployment_url', 'like', "%{$term}%")
                ->orWhere('server_name', 'like', "%{$term}%")
                ->orWhereHas('customer', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('business', 'like', "%{$term}%"))
                ->orWhereHas('product', fn (Builder $q) => $q->where('name', 'like', "%{$term}%")->orWhere('code', 'like', "%{$term}%"));
        });
    }

    public function activityDescription(string $event): ?string
    {
        return "Instance {$this->name} {$event}";
    }
}
