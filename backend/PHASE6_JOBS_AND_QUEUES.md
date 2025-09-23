# 🚀 Phase 6 - Jobs & Queues

## ✅ Implementation Summary

### 1. **TranscodeVideoJob** - Video Processing
- **Purpose**: Asynchronously transcodes uploaded videos to HLS format
- **Behavior**: Downloads video, runs FFmpeg, uploads segments to S3
- **Features**:
    - Multi-quality HLS transcoding
    - Automatic retry on failure
    - Status updates in the database (`transcoding_status`)
    - Local file cleanup after processing
    - Detailed logging for each step

### 2. **WebhookPaymentJob** - PSP Event Processing
- **Purpose**: Handles payment webhooks from providers like CIB, Satim, Chargily
- **Behavior**: Validates signature, processes payment, updates user balance
- **Features**:
    - Provider-agnostic design
    - Idempotent processing (prevents duplicate transactions)
    - Auto-activates pending subscriptions on successful payment
    - Detailed logging for payment status
    - Robust error handling and retry mechanism

### 3. **DailyStatsJob** - Daily Statistics Generation
- **Purpose**: Calculates and caches daily platform statistics
- **Behavior**: Runs daily at midnight via scheduler
- **Features**:
    - Comprehensive stats for users, payments, content, etc.
    - Caches results for fast dashboard loading
    - Tracks key metrics like daily revenue, new users, and engagement
    - Handles failures gracefully and logs errors

## 🔧 Configuration & Setup

### 1. Queue Configuration (`config/queue.php`)
- **Driver**: Set to `database` for reliable queue processing
- **Table**: `jobs` table created via `php artisan queue:table`

### 2. Scheduler (`routes/console.php`)
- **DailyStatsJob**: Scheduled to run daily at midnight
```php
use Illuminate\Support\Facades\Schedule;
use App\Jobs\DailyStatsJob;

Schedule::job(new DailyStatsJob)->daily();
```

### 3. Controller Integration
- **PaymentController**: Dispatches `WebhookPaymentJob` for background processing
```php
public function webhook(Request $request): JsonResponse
{
    WebhookPaymentJob::dispatch($request->all(), $request->header('X-PSP-Provider'));
    return response()->json(['message' => 'Webhook received'], 202);
}
```
- **ChapterController**: Dispatches `TranscodeVideoJob` after video upload
```php
// In your video upload method:
$course = Course::create(...);
$videoPath = $request->file('video')->store('videos/originals');

TranscodeVideoJob::dispatch($course, $videoPath);
```

## ⚙️ How to Run the Queue Worker

To process jobs, you need to run the queue worker:
```bash
cd c:\Users\ENPEI\alouaoui-school\backend
php artisan queue:work
```

For production, it's recommended to use a process manager like **Supervisor** to keep the queue worker running continuously.

## 🧪 Testing Scenarios

### 1. Test Video Transcoding
1. Upload a video through the `ChapterController` endpoint.
2. Check the `courses` table for `transcoding_status` changing from `pending` to `completed`.
3. Verify that HLS files are created in your S3 bucket.
4. Run `php artisan queue:work` to see the job being processed.

### 2. Test Webhook Processing
1. Send a mock webhook request to `/api/payments/webhook`.
2. Check the `jobs` table for a new `WebhookPaymentJob`.
3. Run `php artisan queue:work` to process the job.
4. Verify that the `payments` table is updated and user balance is adjusted.

### 3. Test Daily Stats Generation
1. Manually trigger the job:
   ```bash
   php artisan tinker
   >>> \App\Jobs\DailyStatsJob::dispatch()
   ```
2. Run `php artisan queue:work`.
3. Check the cache for `latest_daily_stats`.
   ```bash
   php artisan tinker
   >>> cache('latest_daily_stats')
   ```

## 🚀 Production Considerations

### Queue Monitoring
- Use **Laravel Horizon** for a beautiful dashboard and code-driven configuration for your Redis queues.
- Set up monitoring for failed jobs and queue length.

### FFmpeg Installation
- Ensure FFmpeg is installed on your production server and the path is accessible to the PHP process.

### Supervisor Configuration
- Create a Supervisor configuration file to manage the queue worker process, ensuring it restarts automatically if it fails.

## ✅ Job Features Summary

| Job | Purpose | Queue | Async | Idempotent |
|-------------------|-------------------------|---------|-------|------------|
| TranscodeVideoJob | Video processing | `videos` | Yes | Yes |
| WebhookPaymentJob | Payment processing | `webhooks`| Yes | Yes |
| DailyStatsJob | Statistics generation | `default` | Yes | Yes |

**Status: Phase 6 - Jobs & Queues COMPLETE ✅**

All three jobs are implemented and ready for production use, enabling robust, scalable, and asynchronous processing for key business operations!