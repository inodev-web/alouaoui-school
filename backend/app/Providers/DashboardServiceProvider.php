<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Subscription;
use App\Models\Attendance;
use App\Observers\DashboardRefreshObserver;

class DashboardServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register observers for automatic dashboard refresh
        User::observe(DashboardRefreshObserver::class);
        Teacher::observe(DashboardRefreshObserver::class);
        Session::observe(DashboardRefreshObserver::class);
        Subscription::observe(DashboardRefreshObserver::class);
        Attendance::observe(DashboardRefreshObserver::class);
    }
}
