<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\RefreshDashboardViewsJob;
use Carbon\Carbon;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Refresh dashboard views every 4 hours
        $schedule->command('dashboard:refresh --all')
            ->cron('0 */4 * * *')
            ->name('refresh-dashboard-every-4h')
            ->withoutOverlapping()
            ->runInBackground();

        // Refresh dashboard views weekly on Sundays at 3 AM
        $schedule->job(new RefreshDashboardViewsJob('weekly'))
            ->weeklyOn(0, '03:00')
            ->name('refresh-dashboard-weekly')
            ->withoutOverlapping()
            ->runInBackground();

        // Refresh dashboard views monthly on the 1st at 4 AM
        $schedule->job(new RefreshDashboardViewsJob('monthly'))
            ->monthlyOn(1, '04:00')
            ->name('refresh-dashboard-monthly')
            ->withoutOverlapping()
            ->runInBackground();

        // Clean up old refresh logs (keep only last 30 days)
        $schedule->call(function () {
            \DB::table('dashboard_refresh_log')
                ->where('created_at', '<', Carbon::now()->subDays(30))
                ->delete();
        })->dailyAt('05:00')->name('cleanup-dashboard-logs');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
