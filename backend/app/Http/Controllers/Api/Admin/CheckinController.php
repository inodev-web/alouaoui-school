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

        // Check if attendance already exists
        $existingAttendance = Attendance::where('student_uuid', $student->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->when($session, function($query) use ($session) {
                return $query->where('session_id', $session->id);
            })
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Student already checked in for this session',
                'data' => [
                    'student' => [
                        'uuid' => $student->uuid,
                        'firstname' => $student->firstname,
                        'lastname' => $student->lastname,
                        'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
                        'free_subscriber' => $student->isFree(),
                    ],
                    'teacher' => [
                        'uuid' => $teacher->uuid,
                        'name' => $teacher->name ?? 'Teacher',
                    ],
                    'attendance' => $existingAttendance,
                    'already_checked_in' => true,
                ]
            ], 200);
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
                    'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
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

        try {
            $fromDate = $request->get('from_date', now()->startOfMonth());
            $toDate = $request->get('to_date', now()->endOfMonth());
            $teacherId = $request->get('teacher_uuid');

            // Build the base query
            $query = Session::whereBetween('start_time', [$fromDate, $toDate]);

            if ($teacherId) {
                $query->where('teacher_uuid', $teacherId);
            }

            // Get sessions with attendance count (simplified to avoid relation issues)
            $sessions = $query->withCount('attendances')->get();

            // Calculate basic stats
            $totalSessions = $sessions->count();
            $totalAttendances = $sessions->sum('attendances_count');
            $avgAttendance = $totalSessions > 0 ? round($totalAttendances / $totalSessions, 2) : 0;

            // Group by teacher (with null safety)
            $sessionsByTeacher = [];
            foreach ($sessions as $session) {
                $teacherName = 'Unknown Teacher';
                if ($session->teacher_uuid) {
                    $teacher = Teacher::where('uuid', $session->teacher_uuid)->first();
                    if ($teacher) {
                        $teacherName = $teacher->name;
                    }
                }

                if (!isset($sessionsByTeacher[$teacherName])) {
                    $sessionsByTeacher[$teacherName] = [
                        'sessions_count' => 0,
                        'total_attendances' => 0,
                        'average_attendance' => 0,
                    ];
                }

                $sessionsByTeacher[$teacherName]['sessions_count']++;
                $sessionsByTeacher[$teacherName]['total_attendances'] += $session->attendances_count;
            }

            // Calculate averages for each teacher
            foreach ($sessionsByTeacher as $teacherName => &$stats) {
                $stats['average_attendance'] = $stats['sessions_count'] > 0
                    ? round($stats['total_attendances'] / $stats['sessions_count'], 2)
                    : 0;
            }

            // Group by day
            $dailyStats = [];
            foreach ($sessions as $session) {
                $date = optional($session->start_time)->toDateString() ?? 'unknown';

                if (!isset($dailyStats[$date])) {
                    $dailyStats[$date] = [
                        'sessions_count' => 0,
                        'total_attendances' => 0,
                    ];
                }

                $dailyStats[$date]['sessions_count']++;
                $dailyStats[$date]['total_attendances'] += $session->attendances_count;
            }

            // Sort daily stats by date
            ksort($dailyStats);

            $stats = [
                'total_sessions' => $totalSessions,
                'total_attendances' => $totalAttendances,
                'average_attendance_per_session' => $avgAttendance,
                'sessions_by_teacher' => $sessionsByTeacher,
                'daily_stats' => $dailyStats,
            ];

            return response()->json([
                'data' => $stats,
                'period' => [
                    'from' => $fromDate,
                    'to' => $toDate,
                ]
            ]);

        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error in attendanceStats: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            // Return a safe fallback response
            return response()->json([
                'data' => [
                    'total_sessions' => 0,
                    'total_attendances' => 0,
                    'average_attendance_per_session' => 0,
                    'sessions_by_teacher' => [],
                    'daily_stats' => [],
                ],
                'period' => [
                    'from' => $request->get('from_date', now()->startOfMonth()),
                    'to' => $request->get('to_date', now()->endOfMonth()),
                ],
                'error' => 'Failed to load statistics',
                'message' => 'Statistics unavailable - showing default values'
            ]);
        }
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

    /**
     * Get student information by UUID for QR scanner
     */
    public function getStudentInfo(Request $request, $uuid): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = User::where('uuid', $uuid)
            ->where('role', 'student')
            ->with('branch:id,name,code,year_level')
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        // Get active subscriptions
        $subscriptions = $student->activeSubscriptions()
            ->with('teacher:uuid,name,module')
            ->get();

        return response()->json([
            'uuid' => $student->uuid,
            'firstname' => $student->firstname,
            'lastname' => $student->lastname,
            'phone' => $student->phone,
            'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
            'year_of_study' => $student->year_of_study,
            'branch_id' => $student->branch_id,
            'branch' => $student->branch ? [
                'id' => $student->branch->id,
                'name' => $student->branch->name,
                'code' => $student->branch->code,
                'year_level' => $student->branch->year_level,
            ] : null,
            'free_subscriber' => $student->isFree(),
            'subscriptions' => $subscriptions->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'teacher_uuid' => $sub->teacher_uuid,
                    'teacher_name' => $sub->teacher->name ?? 'Unknown',
                    'teacher_module' => $sub->teacher->module ?? '',
                    'starts_at' => $sub->starts_at,
                    'ends_at' => $sub->ends_at,
                    'is_active' => $sub->isActive()
                ];
            })
        ]);
    }

    /**
     * Get today's summary (total scans, unique students, active sessions)
     */
    public function todaySummary(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $today = today();
        $now = now();

        $totalScans = Attendance::whereDate('created_at', $today)->count();
        $uniqueStudents = Attendance::whereDate('created_at', $today)
            ->distinct()
            ->count('student_uuid');

        $baseSessionQuery = Session::whereDate('start_time', $today)
            ->where(function ($query) {
                $query->whereNull('status')->orWhere('status', '!=', 'cancelled');
            });

        $sessionsToday = (clone $baseSessionQuery)->count();

        $sessionsInProgress = (clone $baseSessionQuery)
            ->where('start_time', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('end_time')->orWhere('end_time', '>=', $now);
            })
            ->count();

        return response()->json([
            'data' => [
                'total_scans' => $totalScans,
                'unique_students' => $uniqueStudents,
                'sessions_today' => $sessionsToday,
                'sessions_in_progress' => $sessionsInProgress,
                'generated_at' => $now,
            ]
        ]);
    }

    /**
     * Get today's sessions with student subscription status
     */
    public function getTodaysSessionsWithStudent(Request $request, $studentUuid): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = User::where('uuid', $studentUuid)
            ->where('role', 'student')
            ->with('branch:id,name,code,year_level')
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        // Get today's sessions with pricing details, filtered by student year/branch when applicable
        $todaysSessions = Session::with([
                'teacher:uuid,name,module,price_subscription,price_session',
                'branches:id,name,code'
            ])
            ->whereDate('start_time', today())
            ->whereNull('status')  // Only sessions with null status (pending/available for check-in)
            ->when($student->year_of_study, function ($query, $year) {
                // Filter by student's year (only show sessions matching student's year or sessions for all years)
                $query->where(function ($inner) use ($year) {
                    $inner->where('year_target', $year)
                        ->orWhereNull('year_target'); // Include sessions with no specific year target
                });
            })
            ->when($student->branch_id, function ($query, $branchId) {
                // Filter by student's branch (for high school students with specific branches)
                $query->where(function ($inner) use ($branchId) {
                    $inner->where('branch_id', $branchId)
                        ->orWhereHas('branches', function ($branchQuery) use ($branchId) {
                            $branchQuery->where('branches.id', $branchId);
                        })
                        ->orWhere(function ($nullBranch) {
                            // Include sessions with no specific branch target
                            $nullBranch->whereNull('branch_id')
                                ->whereDoesntHave('branches');
                        });
                });
            })
            ->orderBy('start_time')
            ->get();

        $sessionIds = $todaysSessions->pluck('id')->filter()->values();

        $attendancesBySession = Attendance::whereIn('session_id', $sessionIds)
            ->where('student_uuid', $student->uuid)
            ->get()
            ->keyBy('session_id');

        // Get active subscriptions
        $subscriptions = $student->activeSubscriptions()
            ->with('teacher:uuid,name,module')
            ->get();

        // Check subscription status for each session
        $sessionsWithStatus = $todaysSessions->map(function ($session) use ($subscriptions) {
            $hasActiveSubscription = $subscriptions->where('teacher_uuid', $session->teacher_uuid)->isNotEmpty();

            return [
                'id' => $session->id,
                'start_time' => $session->start_time,
                'end_time' => $session->end_time,
                'status' => $session->status,
                'teacher' => [
                    'uuid' => $session->teacher->uuid,
                    'name' => $session->teacher->name,
                    'module' => $session->teacher->module,
                    'price_subscription' => $session->teacher->price_subscription,
                    'price_session' => $session->teacher->price_session,
                ],
                'pricing' => [
                    'subscription' => $session->teacher->price_subscription,
                    'session' => $session->teacher->price_session,
                ],
                'session_date' => optional($session->start_time)?->toDateString(),
                'has_subscription' => $hasActiveSubscription,
                'has_attendance' => false,
                'attendance_time' => null,
            ];
        });

        $sessionsWithStatus = $sessionsWithStatus->map(function ($sessionData) use ($attendancesBySession) {
            if (!$sessionData['id']) {
                return $sessionData;
            }

            $attendance = $attendancesBySession->get($sessionData['id']);

            if ($attendance) {
                $sessionData['has_attendance'] = true;
                $sessionData['attendance_time'] = optional($attendance->validated_at ?? $attendance->created_at)?->toIso8601String();
            }

            return $sessionData;
        });

        return response()->json([
            'student' => [
                'uuid' => $student->uuid,
                'firstname' => $student->firstname,
                'lastname' => $student->lastname,
                'phone' => $student->phone,
                'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
                'year_of_study' => $student->year_of_study,
                'branch_id' => $student->branch_id,
                'branch' => $student->branch ? [
                    'id' => $student->branch->id,
                    'name' => $student->branch->name,
                    'code' => $student->branch->code,
                    'year_level' => $student->branch->year_level,
                ] : null,
                'free_subscriber' => $student->isFree(),
            ],
            'subscriptions' => $subscriptions->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'teacher_uuid' => $sub->teacher_uuid,
                    'teacher_name' => $sub->teacher->name ?? 'Unknown',
                    'teacher_module' => $sub->teacher->module ?? '',
                    'starts_at' => $sub->starts_at,
                    'ends_at' => $sub->ends_at,
                    'is_active' => $sub->isActive()
                ];
            }),
            'todays_sessions' => $sessionsWithStatus
        ]);
    }
}
