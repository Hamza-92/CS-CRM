<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DealStage extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = ['name', 'slug', 'color', 'probability', 'status', 'is_won', 'is_lost', 'sort_order'];

    protected function casts(): array
    {
        return ['probability' => 'integer', 'is_won' => 'boolean', 'is_lost' => 'boolean', 'sort_order' => 'integer'];
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'stage_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function activityType(): string
    {
        return 'deal_stage';
    }

    public function activityDescription(string $event): ?string
    {
        return "Deal stage {$this->name} {$event}";
    }
}
