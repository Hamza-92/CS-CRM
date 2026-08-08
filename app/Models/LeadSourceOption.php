<?php

namespace App\Models;

use App\Support\Audit\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadSourceOption extends Model
{
    use LogsActivity;

    protected $table = 'lead_sources';

    protected $fillable = ['name', 'slug', 'description', 'status', 'sort_order'];

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
        return $this->hasMany(Lead::class, 'source', 'slug');
    }

    public function activityType(): string
    {
        return 'lead_source';
    }

    public function activityDescription(string $event): ?string
    {
        return "Lead source {$this->name} {$event}";
    }
}
