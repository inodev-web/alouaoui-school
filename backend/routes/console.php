<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\DailyStatsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Schedule the daily stats job to run at midnight
Schedule::job(new DailyStatsJob)->daily();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();
