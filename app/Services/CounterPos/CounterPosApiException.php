<?php

namespace App\Services\CounterPos;

use RuntimeException;

final class CounterPosApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly ?string $apiCode = null,
    ) {
        parent::__construct($message);
    }
}
