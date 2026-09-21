<?php

namespace App\Jobs;

use App\Models\TenantOperation;
use App\Services\TenantProvisioningWorkflow;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProvisionTenant implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 900;

    public function __construct(
        public readonly int $operationId,
        public readonly ?string $fromStep = null,
        /** @var array{name: string, email: string, password: string}|null */
        public readonly ?array $administrator = null,
    ) {}

    public function handle(TenantProvisioningWorkflow $workflow): void
    {
        $operation = TenantOperation::query()->find($this->operationId);
        if (! $operation || $operation->status === 'succeeded') {
            return;
        }

        $workflow->run($operation, $this->fromStep, $this->administrator);
    }
}
