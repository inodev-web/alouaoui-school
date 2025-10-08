<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Services\AccessControlService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class CheckinController extends Controller
{
    public function __construct(
        protected AccessControlService $accessControl,
        protected SubscriptionService $subscriptions
    ) {}

    /**
     * Scan QR code and check-in student
     */
    public function scanQr(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            // accept either user_uuid or legacy uuid param from frontend
            'user_uuid' => 'sometimes|exists:users,uuid',
            'uuid' => 'sometimes|exists:users,uuid',
            'teacher_uuid' => 'required|exists:teachers,uuid',
            'mode' => 'sometimes|in:monthly,session_pass',
            'session_id' => 'sometimes|exists:sessions,id',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

    $targetUuid = $request->get('user_uuid') ?? $request->get('uuid');
    $student = User::where('uuid', $targetUuid)->firstOrFail();
        $teacher = Teacher::where('uuid', $request->teacher_uuid)->firstOrFail();
        $mode = $request->mode; // optional (monthly|session_pass)

        // Determine session (if provided) else create ephemeral in-memory session instance for classification
        $session = null;
        if ($request->filled('session_id')) {
            $session = Session::findOrFail($request->session_id);
        }

        // If free subscriber: no subscription creation
        $createdSubscription = null;
        if ($student->isFree()) {
            // skip subscription creation
        } else {
            if ($mode === 'monthly') {
                // Vérifier s'il y a déjà une subscription active
                $activeSubscription = $student->activeSubscriptions()
                    ->where('teacher_uuid', $teacher->uuid)
                    ->first();
                
                if ($activeSubscription) {
                    // Subscription active trouvée, pas besoin d'en créer une nouvelle
                    $createdSubscription = null;
                } else {
                    try {
                        $createdSubscription = $this->subscriptions->createMonthly($student, $teacher);
                    } catch (\RuntimeException $e) {
                        // Overlap avec subscription future -> erreur
                        if (str_contains($e->getMessage(), 'Overlapping')) {
                            return response()->json([
                                'message' => 'Overlapping monthly subscription detected.',
                                'error' => $e->getMessage()
                            ], 422);
                        }
                        // Autres erreurs -> ignorer et continuer
                    }
                }
            } elseif ($mode === 'session_pass') {
                try {
                    $createdSubscription = $this->subscriptions->createSessionPass($student, $teacher, $session);
                } catch (\RuntimeException $e) {
                    // ignore errors for pass
                }
            }
        }

        // Create attendance (student_uuid, teacher_uuid, session_id optional)
        $attendance = Attendance::create([
            'student_uuid' => $student->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session?->id,
            'validated_at' => now(),
        ]);

        $classification = (new \App\Services\SubscriptionService())->classify($student, now(), $teacher);

        return response()->json([
            'message' => 'Scan processed',
            'data' => [
                'student' => [
                    'uuid' => $student->uuid,
                    'firstname' => $student->firstname,
                    'lastname' => $student->lastname,
                    'free_subscriber' => $student->isFree(),
                ],
                'teacher' => [
                    'uuid' => $teacher->uuid,
                    'name' => $teacher->name ?? 'Teacher',
                ],
                'subscription_created' => $createdSubscription ? [
                    'id' => $createdSubscription->id,
                    'starts_at' => $createdSubscription->starts_at,
                    'ends_at' => $createdSubscription->ends_at,
                ] : null,
                'attendance' => $attendance,
                'classification' => $classification,
            ]
        ], 201);
    }

    /**
     * Get session attendance list
     */
    public function sessionAttendance(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'teacher_uuid' => 'required|exists:teachers,uuid',
            'session_date' => 'sometimes|date', // legacy support
            'date' => 'sometimes|date', // new format
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Support both legacy session_date and new date parameter
        $targetDate = $request->get('date') ?? $request->get('session_date');
        if (!$targetDate) {
            return response()->json([
                'message' => 'Either date or session_date parameter is required'
            ], 422);
        }

        $dayStart = now()->parse($targetDate)->startOfDay();
        $dayEnd = (clone $dayStart)->endOfDay();
        $session = Session::where('teacher_uuid', $request->teacher_uuid)
            ->whereBetween('start_time', [$dayStart, $dayEnd])
            ->with(['teacher:uuid,name'])
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'No session found for this date and teacher'
            ], 404);
        }

        $attendances = $session->attendances()
            ->with(['user:id,name,email,phone,year_of_study'])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => [
                'session' => [
                    'id' => $session->id,
                    'date' => $session->start_time?->toDateString(),
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'teacher' => $session->teacher,
                ],
                'attendances' => $attendances,
                'stats' => [
                    'total_present' => $attendances->count(),
                    'first_checkin' => $attendances->first()?->created_at,
                    'last_checkin' => $attendances->last()?->created_at,
                ]
            ]
        ]);
    }

    /**
     * Get attendance statistics
     */
    public function attendanceStats(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fromDate = $request->get('from_date', now()->startOfMonth());
        $toDate = $request->get('to_date', now()->endOfMonth());
    $teacherId = $request->get('teacher_uuid');

    $query = Session::whereBetween('start_time', [$fromDate, $toDate]);

        if ($teacherId) {
            $query->where('teacher_uuid', $teacherId);
        }

        $sessions = $query->with(['teacher:id,name', 'attendances.user:id,name'])
            ->withCount('attendances')
            ->get();

        $stats = [
            'total_sessions' => $sessions->count(),
            'total_attendances' => $sessions->sum('attendances_count'),
            'average_attendance_per_session' => $sessions->count() > 0
                ? round($sessions->sum('attendances_count') / $sessions->count(), 2)
                : 0,
            'sessions_by_teacher' => $sessions->groupBy('teacher.name')->map(function ($teacherSessions) {
                return [
                    'sessions_count' => $teacherSessions->count(),
                    'total_attendances' => $teacherSessions->sum('attendances_count'),
                    'average_attendance' => $teacherSessions->count() > 0
                        ? round($teacherSessions->sum('attendances_count') / $teacherSessions->count(), 2)
                        : 0,
                ];
            }),
            'daily_stats' => $sessions->groupBy(function($s){ return optional($s->start_time)->toDateString(); })->map(function ($daySessions) {
                return [
                    'sessions_count' => $daySessions->count(),
                    'total_attendances' => $daySessions->sum('attendances_count'),
                ];
            })->sortKeys(),
        ];

        return response()->json([
            'data' => $stats,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ]
        ]);
    }

    /**
     * Get student attendance history
     */
    public function studentHistory(Request $request, User $student): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($student->role !== 'student') {
            return response()->json([
                'message' => 'User is not a student'
            ], 422);
        }

        $perPage = $request->get('per_page', 15);
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = $student->attendances()
            ->with(['session.teacher:id,name,specialization']);

        if ($fromDate) {
            $query->whereHas('session', function ($q) use ($fromDate) {
                $q->where('start_time', '>=', $fromDate);
            });
        }

        if ($toDate) {
            $query->whereHas('session', function ($q) use ($toDate) {
                $q->where('start_time', '<=', $toDate);
            });
        }

        $attendances = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'year_of_study' => $student->year_of_study,
            ],
            'data' => $attendances->items(),
            'meta' => [
                'current_page' => $attendances->currentPage(),
                'last_page' => $attendances->lastPage(),
                'per_page' => $attendances->perPage(),
                'total' => $attendances->total(),
            ]
        ]);
    }

    /**
     * Manual check-in (for admin corrections)
     */
    public function manualCheckin(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_uuid' => 'required|exists:users,uuid',
            'teacher_uuid' => 'required|exists:teachers,uuid',
            'session_date' => 'sometimes|date', // legacy support
            'target_date' => 'sometimes|date', // new format (renamed to avoid conflict)
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Support both legacy session_date and new target_date parameter
        $targetDate = $request->get('target_date') ?? $request->get('session_date');
        if (!$targetDate) {
            return response()->json([
                'message' => 'Either target_date or session_date parameter is required'
            ], 422);
        }

        $student = User::where('uuid', $request->user_uuid)->firstOrFail();
    $teacher = Teacher::where('uuid', $request->teacher_uuid)->firstOrFail();

        if ($student->role !== 'student') {
            return response()->json([
                'message' => 'User is not a student'
            ], 422);
        }

        // Créer ou récupérer la session
        $dayStart = now()->parse($targetDate)->setTime(8,0);
        $dayEnd = (clone $dayStart)->addHours(2);
        $session = Session::firstOrCreate([
            'teacher_uuid' => $teacher->uuid,
            'start_time' => $dayStart,
        ], [
            'end_time' => $dayEnd,
            'status' => 'completed',
        ]);

        // Vérifier si déjà présent
        $existingAttendanceQuery = Attendance::where('session_id', $session->id)
            ->where('student_uuid', $student->uuid);
        $existingAttendance = $existingAttendanceQuery->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Student already marked as present for this session'
            ], 422);
        }

        // Créer la présence
        $attendance = Attendance::create([
            'session_id' => $session->id,
            'student_uuid' => $student->uuid,
            'teacher_uuid' => $teacher->uuid,
            'validated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student manually checked in successfully',
            'data' => [
                'attendance' => $attendance,
                'student' => $student->only(['id', 'name', 'email']),
                'session' => [
                    'id' => $session->id,
                    'date' => $session->start_time?->toDateString(),
                    'teacher' => $teacher->name,
                ]
            ]
        ], 201);
    }
}
