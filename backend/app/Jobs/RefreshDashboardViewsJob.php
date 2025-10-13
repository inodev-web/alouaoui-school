<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\DashboardMaterializedViewService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RefreshDashboardViewsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $periodType;
    protected $date;

    /**
     * Create a new job instance.
     */
    public function __construct(string $periodType = 'daily', ?Carbon $date = null)
    {
        $this->periodType = $periodType;
        $this->date = $date ?? Carbon::now();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Starting dashboard views refresh job", [
                'period_type' => $this->periodType,
                'date' => $this->date->format('Y-m-d')
            ]);

            $service = new DashboardMaterializedViewService();
            
            // Refresh all materialized views
            $service->refreshDashboardSummary($this->date, $this->periodType);
            $service->refreshTeacherPerformance($this->date, $this->periodType);
            $service->refreshRevenueTimeSeries($this->date, $this->periodType);

            Log::info("Dashboard views refresh job completed successfully", [
                'period_type' => $this->periodType,
                'date' => $this->date->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            Log::error("Dashboard views refresh job failed", [
                'period_type' => $this->periodType,
                'date' => $this->date->format('Y-m-d'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Dashboard views refresh job failed permanently", [
            'period_type' => $this->periodType,
            'date' => $this->date->format('Y-m-d'),
            'error' => $exception->getMessage()
        ]);
    }
}
