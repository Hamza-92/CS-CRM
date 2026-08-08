<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property string $event
 * @property string|null $description
 * @property array<string, mixed>|null $properties
 */
#[Fillable(['event', 'description', 'subject_type', 'subject_id', 'user_id', 'properties', 'ip_address'])]
class Activity extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeForSubject(Builder $query, Model $subject): Builder
    {
        return $query->where('subject_type', $subject->getMorphClass())
            ->where('subject_id', $subject->getKey());
    }

    /**
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function changes(): array
    {
        $old = $this->properties['old'] ?? [];
        $new = $this->properties['new'] ?? [];

        return collect(array_keys($new + $old))
            ->mapWithKeys(fn (string $key) => [$key => [
                'old' => $old[$key] ?? null,
                'new' => $new[$key] ?? null,
            ]])
            ->all();
    }
}
