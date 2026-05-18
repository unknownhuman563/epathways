<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class AccommodationController extends Controller
{
    /**
     * Accommodation overview. No backend models for settlement clients exist
     * yet — this is a scaffold dashboard returning zeros that will be wired up
     * once Accommodation Client / settlement-task tables are introduced.
     */
    public function dashboard()
    {
        try {
            return inertia('portal/accommodation/Dashboard', [
                'clientStats' => [
                    'total' => 0,
                    'pre_arrival' => 0,
                    'recently_arrived' => 0,
                    'settled' => 0,
                ],
                'taskStats' => [
                    'overdue' => 0,
                    'due_this_week' => 0,
                    'completed_this_month' => 0,
                ],
                'recentClients' => collect(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/accommodation/Dashboard', [
                'clientStats' => array_fill_keys(['total', 'pre_arrival', 'recently_arrived', 'settled'], 0),
                'taskStats' => array_fill_keys(['overdue', 'due_this_week', 'completed_this_month'], 0),
                'recentClients' => collect(),
            ]);
        }
    }
}
