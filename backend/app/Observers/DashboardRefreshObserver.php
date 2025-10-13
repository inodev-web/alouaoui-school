<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Subscription;
use App\Models\Attendance;
use App\Jobs\RefreshDashboardViewsJob;
use Illuminate\Support\Facades\Log;

class DashboardRefreshObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created($model): void
    {
        $this->scheduleRefresh($model, 'created');
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated($model): void
    {
        $this->scheduleRefresh($model, 'updated');
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted($model): void
    {
        $this->scheduleRefresh($model, 'deleted');
    }

    /**
     * Schedule dashboard refresh based on model changes
     */
    private function scheduleRefresh($model, string $operation): void
    {
        try {
            $tableName = $model->getTable();
            $shouldRefresh = false;

            // Determine if this change affects dashboard metrics
            switch ($tableName) {
                case 'users':
                    // Refresh if role is student or if subscription-related fields changed
                    if ($model->role === 'student' || $this->isSubscriptionRelatedChange($model, $operation)) {
                        $shouldRefresh = true;
                    }
                    break;

                case 'teachers':
                    // Always refresh when teacher data changes
                    $shouldRefresh = true;
                    break;

                case 'sessions':
                    // Refresh if session status or timing changed
                    if ($this->isSessionMetricChange($model, $operation)) {
                        $shouldRefresh = true;
                    }
                    break;

                case 'subscriptions':
                    // Always refresh when subscription data changes
                    $shouldRefresh = true;
                    break;

                case 'attendances':
                    // Refresh if attendance affects student counts
                    $shouldRefresh = true;
                    break;
            }

            if ($shouldRefresh) {
                // Schedule refresh job with a delay to batch multiple changes
                RefreshDashboardViewsJob::dispatch('daily')
                    ->delay(now()->addMinutes(5));
                
                Log::info("Dashboard refresh scheduled", [
                    'table' => $tableName,
                    'operation' => $operation,
                    'model_id' => $model->getKey()
                ]);
            }

        } catch (\Exception $e) {
            Log::error("Failed to schedule dashboard refresh", [
                'table' => $model->getTable(),
                'operation' => $operation,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Check if user change affects subscription metrics
     */
    private function isSubscriptionRelatedChange($model, string $operation): bool
    {
        if ($operation === 'created' || $operation === 'deleted') {
            return true;
        }

        // Check if subscription-related fields changed
        $subscriptionFields = ['role', 'free_subscriber', 'free_subscriber_reason'];
        return $model->wasChanged($subscriptionFields);
    }

    /**
     * Check if session change affects metrics
     */
    private function isSessionMetricChange($model, string $operation): bool
    {
        if ($operation === 'created' || $operation === 'deleted') {
            return true;
        }

        // Check if metric-affecting fields changed
        $metricFields = ['status', 'start_time', 'end_time', 'teacher_uuid'];
        return $model->wasChanged($metricFields);
    }
}
