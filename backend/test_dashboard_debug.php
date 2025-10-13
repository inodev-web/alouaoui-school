<?php

require_once 'vendor/autoload.php';

use App\Services\DashboardMaterializedViewService;
use Carbon\Carbon;

echo "Testing Dashboard Service...\n";

try {
    $service = new DashboardMaterializedViewService();
    
    echo "Service created successfully\n";
    
    // Test refresh dashboard summary
    echo "Testing refresh dashboard summary...\n";
    $service->refreshDashboardSummary(Carbon::now(), 'daily');
    echo "Dashboard summary refresh completed\n";
    
    // Check if data was inserted
    $summary = \DB::table('dashboard_summary')->get();
    echo "Dashboard summary records: " . $summary->count() . "\n";
    
    if ($summary->count() > 0) {
        echo "First record: " . json_encode($summary->first()) . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
