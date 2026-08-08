<?php

namespace App\Support\Audit;

use App\Models\Activity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * @var array<int, string>
     */
    protected array $redacted = [
        'password',
        'secret',
        'token',
        'api_key',
        'private_key',
        'credential',
    ];

    /**
     * @param  array<string, mixed>  $properties
     */
    public function log(
        string $event,
        ?Model $subject = null,
        ?string $description = null,
        array $properties = [],
        ?int $userId = null,
    ): Activity {
        return Activity::create([
            'event' => $event,
            'description' => $description,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'user_id' => $userId ?? Auth::id(),
            'properties' => $properties === [] ? null : $this->redact($properties),
            'ip_address' => Request::ip(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $properties
     * @return array<string, mixed>
     */
    public function redact(array $properties): array
    {
        foreach ($properties as $key => $value) {
            if (is_array($value)) {
                $properties[$key] = $this->redact($value);

                continue;
            }

            if (is_string($key) && $this->isSecret($key)) {
                $properties[$key] = '[redacted]';
            }
        }

        return $properties;
    }

    protected function isSecret(string $key): bool
    {
        $key = strtolower($key);

        foreach ($this->redacted as $needle) {
            if (str_contains($key, $needle)) {
                return true;
            }
        }

        return false;
    }
}
