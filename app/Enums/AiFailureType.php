<?php

namespace App\Enums;

enum AiFailureType: string
{
    case RETRYABLE = 'RETRYABLE';
    case MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE';
    case AUTH_OR_BILLING = 'AUTH_OR_BILLING';
    case BAD_REQUEST = 'BAD_REQUEST';
    case INVALID_OUTPUT = 'INVALID_OUTPUT';
}
