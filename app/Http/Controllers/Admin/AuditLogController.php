<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs with action filters and pagination.
     */
    public function index(Request $request): Response
    {
        $query = AuditLog::with('admin')->latest();

        if ($action = $request->string('action')->trim()->toString()) {
            $query->where('action', 'like', "%{$action}%");
        }

        $logs = $query->paginate(15)
            ->withQueryString()
            ->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'admin_name' => $log->admin?->name ?? 'System',
                'admin_email' => $log->admin?->email ?? '',
                'action' => $log->action,
                'target_type' => class_basename($log->target_type),
                'target_id' => $log->target_id,
                'meta' => $log->meta,
                'ip' => $log->ip,
                'created_at' => $log->created_at->toISOString(),
                'formatted_date' => $log->created_at->format('M j, Y • g:i:s A'),
            ]);

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'action' => $request->string('action')->toString(),
            ],
        ]);
    }
}
