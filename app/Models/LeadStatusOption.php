<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadStatusOption extends Model
{
    use LogsActivity;

    protected $table = 'lead_statuses';

    protected $fillable = ['name', 'slug', 'description', 'color', 'status', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'status', 'slug');
    }

    public function activityType(): string
    {
        return 'lead_status';
    }

    public function activityDescription(string $event): ?string
    {
        return "Lead status {$this->name} {$event}";
    }
}
