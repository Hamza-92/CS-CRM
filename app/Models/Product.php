<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Models\Role;

#[Fillable([
    'name',
    'code',
    'brand_color',
    'description',
    'is_active',
    'technical_owner_id',
    'support_role_id',
    'default_trial_days',
    'demo_notes',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'default_trial_days' => 'integer',
        ];
    }

    protected function code(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtoupper(trim($value)),
        );
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class)->orderBy('sort_order')->orderBy('name');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ApplicationInstance::class);
    }

    public function technicalOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technical_owner_id');
    }

    public function supportRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'support_role_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($term) {
            $query->where('name', 'like', "%{$term}%")
                ->orWhere('code', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }

    public function activityDescription(string $event): ?string
    {
        return "Product {$this->name} {$event}";
    }
}
