<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * Log a sensitive admin action.
     */
    public static function log(
        string $action,
        ?Model $target = null,
        array $meta = [],
        ?User $admin = null,
        ?Request $request = null
    ): AuditLog {
        $admin = $admin ?: auth()->user();
        $request = $request ?: request();

        return AuditLog::create([
            'admin_id' => $admin ? $admin->id : 1,
            'action' => $action,
            'target_type' => $target ? get_class($target) : null,
            'target_id' => $target ? $target->getKey() : null,
            'meta' => $meta,
            'ip' => $request ? $request->ip() : null,
        ]);
    }
}
