<?php

namespace App\Support\Audit;

use App\Models\Activity;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (self $model) {
            $model->recordActivity('created', ['new' => $model->auditableSnapshot()]);
        });

        static::updated(function (self $model) {
            $changes = $model->auditableChanges();

            if ($changes === []) {
                return;
            }

            $model->recordActivity('updated', $changes);
        });

        static::deleted(function (self $model) {
            $model->recordActivity($model->isArchiving() ? 'archived' : 'deleted');
        });

        if (in_array(SoftDeletes::class, class_uses_recursive(static::class), true)) {
            static::restored(function (self $model) {
                $model->recordActivity('restored');
            });
        }
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    public function recordActivity(string $event, array $properties = []): Activity
    {
        return app(ActivityLogger::class)->log(
            event: $this->activityType().'.'.$event,
            subject: $this,
            description: $this->activityDescription($event),
            properties: $properties,
        );
    }

    public function activityType(): string
    {
        return Str::snake(class_basename($this));
    }

    public function activityDescription(string $event): ?string
    {
        return Str::headline($this->activityType()).' '.$event;
    }

    /**
     * @return array<int, string>
     */
    public function auditedAttributes(): array
    {
        $attributes = property_exists($this, 'audited')
            ? $this->audited
            : $this->getFillable();

        return array_values(array_diff($attributes, $this->getHidden()));
    }

    /**
     * @return array<string, mixed>
     */
    public function auditableSnapshot(): array
    {
        return array_intersect_key(
            $this->getAttributes(),
            array_flip($this->auditedAttributes()),
        );
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function auditableChanges(): array
    {
        $changed = array_intersect_key(
            $this->getChanges(),
            array_flip($this->auditedAttributes()),
        );

        if ($changed === []) {
            return [];
        }

        $old = [];

        foreach (array_keys($changed) as $key) {
            $old[$key] = $this->getRawOriginal($key);
        }

        return ['old' => $old, 'new' => $changed];
    }

    public function isArchiving(): bool
    {
        return in_array(SoftDeletes::class, class_uses_recursive(static::class), true)
            && ! $this->isForceDeleting();
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'subject')->latest('created_at');
    }
}
