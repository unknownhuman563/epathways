<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    public function index()
    {
        // Most recent activity, capped — client-side filtering/paging on the page.
        $logs = ActivityLog::with('user:id,name,email')
            ->latest()
            ->limit(1000)
            ->get();

        return inertia('admin/ActivityLogs', [
            'logs' => $logs,
            'actions' => ActivityLog::query()->distinct()->orderBy('action')->pluck('action'),
            'portals' => ActivityLog::query()->whereNotNull('portal')->distinct()->orderBy('portal')->pluck('portal'),
        ]);
    }
}
