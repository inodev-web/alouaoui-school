<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DashboardMaterializedViewService;
use Carbon\Carbon;

class RefreshDashboardViews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dashboard:refresh 
                            {--period=daily : Period type (daily, weekly, monthly)}
                            {--date= : Specific date to refresh (Y-m-d format)}
                            {--all : Refresh all materialized views}
                            {--summary : Refresh only dashboard summary}
                            {--teachers : Refresh only teacher performance}
                            {--revenue : Refresh only revenue time series}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh dashboard materialized views for better performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $service = new DashboardMaterializedViewService();
        $period = $this->option('period');
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : null;
        
        $this->info("Refreshing dashboard materialized views...");
        $this->info("Period: {$period}");
        if ($date) {
            $this->info("Date: {$date->format('Y-m-d')}");
        }

        try {
            if ($this->option('all')) {
                $this->info("Refreshing all materialized views...");
                $service->refreshAll();
                $this->info("✅ All materialized views refreshed successfully!");
            } else {
                if ($this->option('summary')) {
                    $this->info("Refreshing dashboard summary...");
                    $service->refreshDashboardSummary($date, $period);
                    $this->info("✅ Dashboard summary refreshed successfully!");
                }
                
                if ($this->option('teachers')) {
                    $this->info("Refreshing teacher performance...");
                    $service->refreshTeacherPerformance($date, $period);
                    $this->info("✅ Teacher performance refreshed successfully!");
                }
                
                if ($this->option('revenue')) {
                    $this->info("Refreshing revenue time series...");
                    $service->refreshRevenueTimeSeries($date, $period);
                    $this->info("✅ Revenue time series refreshed successfully!");
                }
                
                if (!$this->option('summary') && !$this->option('teachers') && !$this->option('revenue')) {
                    $this->error("Please specify which views to refresh using --summary, --teachers, --revenue, or --all");
                    return 1;
                }
            }
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("❌ Error refreshing materialized views: " . $e->getMessage());
            return 1;
        }
    }
}
