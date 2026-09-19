<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class TenantOperation extends Model
{
    public const TYPES = [
        'provision',
        'test_connection',
        'migrate',
        'seed_template',
        'activate',
        'pause',
        'retire',
        'sync',
    ];

    public const STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled'];

    protected $fillable = [
        'application_instance_id',
        'requested_by_id',
        'type',
        'status',
        'idempotency_key',
        'counterpos_operation_id',
        'request_payload',
        'result',
        'error_code',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'result' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function applicationInstance(): BelongsTo
    {
        return $this->belongsTo(ApplicationInstance::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }
}