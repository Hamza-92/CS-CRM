<?php

namespace App\Services\Hostinger;

use RuntimeException;

final class HostingerApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly ?string $correlationId = null,
    ) {
        parent::__construct($message);
    }
}
