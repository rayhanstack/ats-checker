<?php

namespace App\Exceptions;

use Exception;
use Throwable;

class AiProviderException extends Exception
{
    public function __construct(
        string $message = '',
        public int $httpStatus = 0,
        public ?int $retryAfterSeconds = null,
        public int $latencyMs = 0,
        public bool $isInvalidOutput = false,
        public ?string $responseBody = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $httpStatus, $previous);
    }
}
