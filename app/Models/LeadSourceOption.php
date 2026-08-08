<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadSourceOption extends Model
{
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
}
