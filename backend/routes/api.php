<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\Admin\CheckinController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\StreamController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes (public)
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');

    // Protected auth routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
        Route::get('/profile', [AuthController::class, 'profile'])->name('profile');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->name('update-profile');
        Route::put('/change-password', [AuthController::class, 'changePassword'])->name('change-password');
        Route::post('/regenerate-qr', [AuthController::class, 'regenerateQrToken'])->name('regenerate-qr');
        Route::post('/check-device', [AuthController::class, 'checkDevice'])->name('check-device');
    });
});

// Payment webhook (public - no auth required)
Route::post('/payments/webhook', [PaymentController::class, 'webhook'])->name('payments.webhook');

// Protected routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {

    // Get current user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Routes requiring single device enforcement
    Route::middleware('ensure.single.device')->group(function () {
        
        // Teacher management (Admin only)
        Route::prefix('teachers')->name('teachers.')->group(function () {
            Route::get('/active', [TeacherController::class, 'active'])->name('active'); // Public list
            Route::middleware('abilities:admin')->group(function () {
                Route::get('/', [TeacherController::class, 'index'])->name('index');
                Route::post('/', [TeacherController::class, 'store'])->name('store');
                Route::get('/{teacher}', [TeacherController::class, 'show'])->name('show');
                Route::put('/{teacher}', [TeacherController::class, 'update'])->name('update');
                Route::delete('/{teacher}', [TeacherController::class, 'destroy'])->name('destroy');
                Route::patch('/{teacher}/toggle-status', [TeacherController::class, 'toggleStatus'])->name('toggle-status');
                Route::get('/{teacher}/statistics', [TeacherController::class, 'statistics'])->name('statistics');
            });
        });

        // Chapter management with subscription check for video access
        Route::prefix('chapters')->name('chapters.')->group(function () {
            Route::get('/', [ChapterController::class, 'index'])->name('index');
            Route::get('/{chapter}', [ChapterController::class, 'show'])->name('show');
            Route::get('/teacher/{teacher}', [ChapterController::class, 'byTeacher'])->name('by-teacher');

            // Admin only routes
            Route::middleware('abilities:admin')->group(function () {
                Route::post('/', [ChapterController::class, 'store'])->name('store');
                Route::put('/{chapter}', [ChapterController::class, 'update'])->name('update');
                Route::delete('/{chapter}', [ChapterController::class, 'destroy'])->name('destroy');
                Route::patch('/{chapter}/toggle-status', [ChapterController::class, 'toggleStatus'])->name('toggle-status');
                Route::post('/reorder', [ChapterController::class, 'reorder'])->name('reorder');
            });
        });

        // Payment management
        Route::prefix('payments')->name('payments.')->group(function () {
            Route::get('/history', [PaymentController::class, 'history'])->name('history');
            Route::get('/{payment}', [PaymentController::class, 'show'])->name('show');

            // Admin only routes
            Route::middleware('abilities:admin')->group(function () {
                Route::post('/cash', [PaymentController::class, 'addCash'])->name('add-cash');
                Route::patch('/{payment}/cancel', [PaymentController::class, 'cancel'])->name('cancel');
                Route::get('/admin/statistics', [PaymentController::class, 'statistics'])->name('statistics');
            });
        });

        // Subscription management with device verification
        Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
            Route::post('/', [SubscriptionController::class, 'create'])->name('create');
            Route::get('/active', [SubscriptionController::class, 'checkActive'])->name('check-active');
            Route::get('/{subscription}', [SubscriptionController::class, 'show'])->name('show');

            // Admin only routes
            Route::middleware('abilities:admin')->group(function () {
                Route::get('/', [SubscriptionController::class, 'index'])->name('index');
                Route::patch('/{subscription}/extend', [SubscriptionController::class, 'extend'])->name('extend');
                Route::patch('/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('cancel');
                Route::get('/admin/statistics', [SubscriptionController::class, 'statistics'])->name('statistics');
            });
        });

        // Admin check-in management with scanner lock
        Route::prefix('admin/checkin')->name('admin.checkin.')->middleware(['abilities:admin', 'scanner.lock'])->group(function () {
            Route::post('/scan-qr', [CheckinController::class, 'scanQr'])->name('scan-qr');
            Route::get('/session-attendance', [CheckinController::class, 'sessionAttendance'])->name('session-attendance');
            Route::get('/attendance-stats', [CheckinController::class, 'attendanceStats'])->name('attendance-stats');
            Route::get('/student/{student}/history', [CheckinController::class, 'studentHistory'])->name('student-history');
            Route::post('/manual-checkin', [CheckinController::class, 'manualCheckin'])->name('manual-checkin');
        });

        // Routes des cours avec vérification d'abonnement pour le streaming
        Route::prefix('courses')->name('courses.')->group(function () {
            Route::get('/', [CourseController::class, 'index'])->name('index');
            Route::get('/{course}', [CourseController::class, 'show'])->name('show');
            
            // Routes requiring subscription for video access
            Route::middleware('ensure.subscription')->group(function () {
                Route::post('/{course}/stream-token', [CourseController::class, 'streamToken'])->name('stream-token');
            });
            
            Route::post('/{course}/report-issue', [CourseController::class, 'reportIssue'])->name('report-issue');
        });

        // Statistiques de streaming (admin only)
        Route::middleware('abilities:admin')->group(function () {
            Route::get('/streaming/stats', [CourseController::class, 'streamingStats'])->name('streaming.stats');
        });
    });
});

// Routes de streaming (validation par token, pas par auth) avec vérification d'abonnement
Route::prefix('stream')->name('stream.')->group(function () {
    Route::middleware('ensure.subscription')->group(function () {
        Route::get('/video/{course}', [StreamController::class, 'stream'])->name('video');
        Route::get('/hls/{course}/playlist.m3u8', [StreamController::class, 'hlsPlaylist'])->name('hls');
    });
    Route::get('/thumbnail/{course}', [StreamController::class, 'thumbnail'])->name('thumbnail');
});

// Route signée Laravel pour le streaming local
Route::get('/courses/{course}/stream', [StreamController::class, 'stream'])
    ->middleware('signed')
    ->name('courses.stream');
