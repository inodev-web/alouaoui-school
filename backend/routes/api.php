<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\Admin\CheckinController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\UserController;
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
        Route::put('/change-password', [AuthController::class, 'changePassword'])->name('change-password');
        Route::post('/regenerate-qr', [AuthController::class, 'regenerateQrToken'])->name('regenerate-qr');
        Route::post('/check-device', [AuthController::class, 'checkDevice'])->name('check-device');
        Route::post('/force-device-change', [AuthController::class, 'forceDeviceChange'])->name('force-device-change');

        // Profile routes moved outside for testing
    });
});

// Protected routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
    // Profile routes (moved here for testing)
    Route::get('/auth/profile', [AuthController::class, 'profile'])->name('profile');
    Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->name('update-profile');

    // Get current user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User/Student management (Admin only, no device check needed)
    Route::prefix('users')->name('users.')->middleware('abilities:admin')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/stats', [UserController::class, 'stats'])->name('stats');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}', [UserController::class, 'show'])->name('show');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/toggle-free-subscriber', [UserController::class, 'toggleFreeSubscriber'])->name('toggle-free-subscriber');
    });

    // Teacher management (Admin routes don't need device check)
    Route::prefix('teachers')->name('teachers.')->group(function () {
        // Public routes (need device check for students)
        Route::middleware('ensure.single.device')->group(function () {
            Route::get('/active', [TeacherController::class, 'active'])->name('active');
        });

        // Admin only routes (no device check needed)
        Route::middleware('abilities:admin')->group(function () {
            Route::get('/', [TeacherController::class, 'index'])->name('index');
            Route::post('/', [TeacherController::class, 'store'])->name('store');
            Route::get('/{teacher}', [TeacherController::class, 'show'])->name('show');
            Route::put('/{teacher}', [TeacherController::class, 'update'])->name('update');
            Route::delete('/{teacher}', [TeacherController::class, 'destroy'])->name('destroy');
            Route::get('/{teacher}/students-count', [TeacherController::class, 'getStudentsCount'])->name('students-count');
            Route::patch('/{teacher}/toggle-status', [TeacherController::class, 'toggleStatus'])->name('toggle-status');
            Route::get('/{teacher}/statistics', [TeacherController::class, 'statistics'])->name('statistics');
        });
    });

    // Chapter management
    Route::prefix('chapters')->name('chapters.')->group(function () {
        // Public routes (need device check for students)
        Route::middleware('ensure.single.device')->group(function () {
            Route::get('/', [ChapterController::class, 'index'])->name('index');
            Route::get('/{chapter}', [ChapterController::class, 'show'])->name('show');
            Route::get('/teacher/{teacher}', [ChapterController::class, 'byTeacher'])->name('by-teacher');
        });

        // Admin only routes (no device check needed)
        Route::middleware('abilities:admin')->group(function () {
            Route::post('/', [ChapterController::class, 'store'])->name('store');
            Route::put('/{chapter}', [ChapterController::class, 'update'])->name('update');
            Route::delete('/{chapter}', [ChapterController::class, 'destroy'])->name('destroy');
            Route::patch('/{chapter}/toggle-status', [ChapterController::class, 'toggleStatus'])->name('toggle-status');
            Route::post('/reorder', [ChapterController::class, 'reorder'])->name('reorder');
        });
    });

    // Subscription management (needs device check for students)
    Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::post('/', [SubscriptionController::class, 'store'])->name('store')->middleware('ensure.single.device');
        Route::get('/active', [SubscriptionController::class, 'active'])->name('active')->middleware('ensure.single.device'); // Restored device check
        Route::get('/{subscription}', [SubscriptionController::class, 'show'])->name('show')->middleware('ensure.single.device');
    });

    // Admin check-in management (no device check needed for admin)
    Route::prefix('admin/checkin')->name('admin.checkin.')->middleware(['abilities:admin', 'scanner.lock'])->group(function () {
        Route::post('/scan-qr', [CheckinController::class, 'scanQr'])->name('scan-qr');
        Route::get('/session-attendance', [CheckinController::class, 'sessionAttendance'])->name('session-attendance');
        Route::get('/attendance-stats', [CheckinController::class, 'attendanceStats'])->name('attendance-stats');
        Route::get('/student/{student}/history', [CheckinController::class, 'studentHistory'])->name('student-history');
        Route::post('/manual-checkin', [CheckinController::class, 'manualCheckin'])->name('manual-checkin');
        Route::get('/student/{uuid}/info', [CheckinController::class, 'getStudentInfo'])->name('student-info');
        Route::get('/student/{uuid}/sessions', [CheckinController::class, 'getTodaysSessionsWithStudent'])->name('student-sessions');
    });

    // Course management
    Route::prefix('courses')->name('courses.')->group(function () {
        // Public routes (need device check for students)
        Route::middleware('ensure.single.device')->group(function () {
            Route::get('/', [CourseController::class, 'index'])->name('index');
            Route::get('/{course}', [CourseController::class, 'show'])->name('show');
            Route::post('/{course}/stream-token', [CourseController::class, 'streamToken'])->name('stream-token');
            Route::post('/{course}/report-issue', [CourseController::class, 'reportIssue'])->name('report-issue');
        });

        // Admin only routes (no device check needed)
        Route::middleware('abilities:admin')->group(function () {
            Route::post('/', [CourseController::class, 'store'])->name('store');
            Route::put('/{course}', [CourseController::class, 'update'])->name('update');
            Route::delete('/{course}', [CourseController::class, 'destroy'])->name('destroy');
            Route::post('/{course}/upload-pdf', [CourseController::class, 'uploadPDF'])->name('upload-pdf');
            Route::delete('/{course}/pdf', [CourseController::class, 'deletePDF'])->name('delete-pdf');
        });
    });

    // Video management routes (alias for courses)
    Route::prefix('videos')->name('videos.')->group(function () {
        // Public routes (need device check for students)
        Route::middleware('ensure.single.device')->group(function () {
            Route::get('/', [CourseController::class, 'index'])->name('index');
            Route::get('/search', [CourseController::class, 'search'])->name('search');
            Route::get('/{course}', [CourseController::class, 'show'])->name('show');
        });

        // Admin only routes (no device check needed)
        Route::middleware('abilities:admin')->group(function () {
            Route::post('/', [CourseController::class, 'store'])->name('store');
            Route::put('/{course}', [CourseController::class, 'update'])->name('update');
            Route::delete('/{course}', [CourseController::class, 'destroy'])->name('destroy');
        });
    });

    // Session management (admin only, no device check needed)
    Route::middleware('abilities:admin')->group(function () {
        Route::prefix('sessions')->name('sessions.')->group(function () {
            Route::get('/', [App\Http\Controllers\Api\SessionController::class, 'index'])->name('index');
            Route::post('/', [App\Http\Controllers\Api\SessionController::class, 'store'])->name('store');
            Route::get('/today', [App\Http\Controllers\Api\SessionController::class, 'today'])->name('today');
            Route::get('/stats', [App\Http\Controllers\Api\SessionController::class, 'stats'])->name('stats');
            Route::get('/{session}', [App\Http\Controllers\Api\SessionController::class, 'show'])->name('show');
            Route::put('/{session}', [App\Http\Controllers\Api\SessionController::class, 'update'])->name('update');
            Route::delete('/{session}', [App\Http\Controllers\Api\SessionController::class, 'destroy'])->name('destroy');
        });
    });

    // Streaming statistics (admin only, no device check needed)
    Route::middleware('abilities:admin')->group(function () {
        Route::get('/streaming/stats', [CourseController::class, 'streamingStats'])->name('streaming.stats');
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
