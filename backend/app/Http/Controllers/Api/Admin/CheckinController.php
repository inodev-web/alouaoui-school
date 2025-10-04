<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class CheckinController extends Controller
{
    protected AccessControlService $accessControl;

    public function __construct(AccessControlService $accessControl)
    {
        // Middleware is now applied in routes/api.php
        $this->accessControl = $accessControl;
    }

    /**
     * Scan QR code and check-in student
     */
    public function scanQr(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'qr_token' => 'required|string',
            'teacher_id' => 'required|exists:teachers,id',
            'session_date' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Trouver l'étudiant par QR token
        $qr = $request->qr_token;
        $student = null;

        // Support QR codes generated from the student numeric id like: StudentID-123
        if (is_string($qr) && strpos($qr, 'StudentID-') === 0) {
            $idPart = substr($qr, strlen('StudentID-'));
            if (ctype_digit($idPart)) {
                $student = User::where('id', (int) $idPart)
                    ->where('role', 'student')
                    ->first();
            }
        }

        // Fallback: lookup by stored qr_token UUID
        if (!$student) {
            $student = User::where('qr_token', $qr)
                ->where('role', 'student')
                ->first();
        }

        if (!$student) {
            return response()->json([
                'message' => 'Invalid QR code or student not found'
            ], 404);
        }

        $teacher = Teacher::findOrFail($request->teacher_id);
        $sessionDate = $request->session_date ? Carbon::parse($request->session_date) : now();

        // Vérifier si l'étudiant a accès aux cours de ce professeur
        if (!$this->accessControl->canAttendPhysicalClass($student, $teacher)) {
            return response()->json([
                'message' => 'Student does not have access to this teacher\'s classes',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'year_of_study' => $student->year_of_study,
                ],
                'access_denied' => true
            ], 403);
        }

        // Créer ou récupérer la session du jour
        $session = Session::firstOrCreate([
            'teacher_id' => $teacher->id,
            'session_date' => $sessionDate->format('Y-m-d'),
        ], [
            'start_time' => $sessionDate->format('H:i:s'),
            'end_time' => $sessionDate->addHours(2)->format('H:i:s'), // 2h par défaut
            'created_by' => $request->user()->id,
        ]);

        // Vérifier si l'étudiant est déjà enregistré pour cette session
        $existingAttendance = Attendance::where([
            'user_id' => $student->id,
            'session_id' => $session->id,
        ])->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Student already checked in for this session',
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'year_of_study' => $student->year_of_study,
                ],
                'session' => [
                    'id' => $session->id,
                    'date' => $session->session_date,
                    'teacher' => $teacher->name,
                ],
                'attendance' => [
                    'checked_in_at' => $existingAttendance->created_at,
                    'already_present' => true,
                ]
            ], 200);
        }

        // Enregistrer la présence
        $attendance = Attendance::create([
            'user_id' => $student->id,
            'session_id' => $session->id,
            'status' => 'present',
            'checked_in_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Student checked in successfully',
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'phone' => $student->phone,
                'year_of_study' => $student->year_of_study,
            ],
            'session' => [
                'id' => $session->id,
                'date' => $session->session_date,
                'teacher' => $teacher->name,
                'teacher_specialization' => $teacher->specialization,
            ],
            'attendance' => [
                'id' => $attendance->id,
                'checked_in_at' => $attendance->created_at,
                'status' => $attendance->status,
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
            'teacher_id' => 'required|exists:teachers,id',
            'session_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $session = Session::where([
            'teacher_id' => $request->teacher_id,
            'session_date' => $request->session_date,
        ])->with(['teacher:id,name,specialization'])->first();

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
                    'date' => $session->session_date,
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
        $teacherId = $request->get('teacher_id');

        $query = Session::whereBetween('session_date', [$fromDate, $toDate]);

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
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
            'daily_stats' => $sessions->groupBy('session_date')->map(function ($daySessions) {
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
                $q->where('session_date', '>=', $fromDate);
            });
        }

        if ($toDate) {
            $query->whereHas('session', function ($q) use ($toDate) {
                $q->where('session_date', '<=', $toDate);
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
            // accept either legacy numeric user_id or new user_uuid
            'user_id' => 'sometimes|exists:users,id',
            'user_uuid' => 'sometimes|exists:users,uuid',
            'teacher_id' => 'required|exists:teachers,id',
            'session_date' => 'required|date',
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->filled('user_uuid')) {
            $student = User::where('uuid', $request->user_uuid)->firstOrFail();
        } else {
            $student = User::findOrFail($request->user_id);
        }
        $teacher = Teacher::findOrFail($request->teacher_id);

        if ($student->role !== 'student') {
            return response()->json([
                'message' => 'User is not a student'
            ], 422);
        }

        // Créer ou récupérer la session
        $session = Session::firstOrCreate([
            'teacher_id' => $teacher->id,
            'session_date' => $request->session_date,
        ], [
            'start_time' => '08:00:00',
            'end_time' => '10:00:00',
            'created_by' => $request->user()->id,
        ]);

        // Vérifier si déjà présent
        $existingAttendanceQuery = Attendance::where('session_id', $session->id);
        if (Schema::hasColumn('attendances', 'user_uuid') && $student->uuid) {
            $existingAttendanceQuery->where('user_uuid', $student->uuid);
        } else {
            $existingAttendanceQuery->where('user_id', $student->id);
        }
        $existingAttendance = $existingAttendanceQuery->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Student already marked as present for this session'
            ], 422);
        }

        // Créer la présence
        $attendanceData = [
            'session_id' => $session->id,
            'status' => 'present',
            'notes' => 'Manual check-in' . ($request->reason ? ': ' . $request->reason : ''),
        ];

        if (Schema::hasColumn('attendances', 'user_uuid') && $student->uuid) {
            $attendanceData['user_uuid'] = $student->uuid;
        } else {
            $attendanceData['user_id'] = $student->id;
        }

        if (Schema::hasColumn('attendances', 'checked_in_by_uuid') && $request->user()->uuid) {
            $attendanceData['checked_in_by_uuid'] = $request->user()->uuid;
        } else {
            $attendanceData['checked_in_by'] = $request->user()->id;
        }

        $attendance = Attendance::create($attendanceData);

        return response()->json([
            'message' => 'Student manually checked in successfully',
            'data' => [
                'attendance' => $attendance,
                'student' => $student->only(['id', 'name', 'email']),
                'session' => [
                    'id' => $session->id,
                    'date' => $session->session_date,
                    'teacher' => $teacher->name,
                ]
            ]
        ], 201);
    }
}
