<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Teacher;
use App\Models\Attendance;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SessionController extends Controller
{
    /**
     * Display a listing of sessions
     */
    public function index(Request $request): JsonResponse
    {
        $query = Session::with(['teacher', 'attendances', 'branch']);

        // Filter by teacher
        if ($request->filled('teacher_uuid')) {
            $query->where('teacher_uuid', $request->teacher_uuid);
        }

        // Filter by year target
        if ($request->filled('year_target')) {
            $query->where('year_target', $request->year_target);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('start_time', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('start_time', '<=', $request->end_date);
        }

        // Search by teacher name or module
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('teacher', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%");
            });
        }

        // Get today's sessions
        if ($request->boolean('today_only')) {
            $query->whereDate('start_time', today());
        }

        $sessions = $query->orderBy('start_time', 'desc')->paginate(20);

        // Transform sessions for frontend
        $transformedSessions = $sessions->getCollection()->map(function ($session) {
            return $this->transformSession($session);
        });

        return response()->json([
            'data' => $transformedSessions,
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ]
        ]);
    }

    /**
     * Store a newly created session
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'teacher_uuid' => 'required|exists:teachers,uuid',
            'year_target' => 'required|in:' . implode(',', Session::YEAR_TARGETS),
            'branch_id' => 'nullable|exists:branches,id',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'status' => 'sometimes|in:' . implode(',', Session::STATUSES),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate branch_id based on year_target
        if ($request->filled('branch_id') && $request->filled('year_target')) {
            $branch = Branch::find($request->branch_id);
            if ($branch && $branch->year_level !== $request->year_target) {
                return response()->json([
                    'message' => 'الفرع المحدد لا يتطابق مع السنة المستهدفة',
                    'errors' => ['branch_id' => ['الفرع المحدد لا يتطابق مع السنة المستهدفة']]
                ], 422);
            }
        }

        // Clear branch_id for middle school sessions
        $branchId = $request->branch_id;
        if ($request->year_target && in_array($request->year_target, ['1AM', '2AM', '3AM', '4AM'])) {
            $branchId = null;
        }

        try {
            $session = Session::create([
                'teacher_uuid' => $request->teacher_uuid,
                'year_target' => $request->year_target,
                'branch_id' => $branchId,
                'start_time' => Carbon::parse($request->start_time),
                'end_time' => Carbon::parse($request->end_time),
                'status' => $request->status ?? 'completed', // Default to completed in simplified model
            ]);

            return response()->json([
                'message' => 'Session created successfully',
                'data' => $this->transformSession($session->load(['teacher', 'attendances']))
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified session
     */
    public function show(Session $session): JsonResponse
    {
        return response()->json([
            'data' => $this->transformSession($session->load(['teacher', 'attendances']))
        ]);
    }

    /**
     * Update the specified session
     */
    public function update(Request $request, Session $session): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'teacher_uuid' => 'sometimes|exists:teachers,uuid',
            'year_target' => 'sometimes|in:' . implode(',', Session::YEAR_TARGETS),
            'branch_id' => 'nullable|exists:branches,id',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'status' => 'sometimes|in:' . implode(',', Session::STATUSES),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate branch_id based on year_target
        if ($request->filled('branch_id') && $request->filled('year_target')) {
            $branch = Branch::find($request->branch_id);
            if ($branch && $branch->year_level !== $request->year_target) {
                return response()->json([
                    'message' => 'الفرع المحدد لا يتطابق مع السنة المستهدفة',
                    'errors' => ['branch_id' => ['الفرع المحدد لا يتطابق مع السنة المستهدفة']]
                ], 422);
            }
        }

        // Clear branch_id for middle school sessions
        $branchId = $request->branch_id;
        if ($request->year_target && in_array($request->year_target, ['1AM', '2AM', '3AM', '4AM'])) {
            $branchId = null;
        }

        try {
            $updateData = $request->only(['teacher_uuid', 'year_target', 'status']);
            if ($request->has('branch_id')) {
                $updateData['branch_id'] = $branchId;
            }
            
            if ($request->has('start_time')) {
                $updateData['start_time'] = Carbon::parse($request->start_time);
            }
            if ($request->has('end_time')) {
                $updateData['end_time'] = Carbon::parse($request->end_time);
            }

            $session->update($updateData);

            return response()->json([
                'message' => 'Session updated successfully',
                'data' => $this->transformSession($session->load(['teacher', 'attendances']))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified session
     */
    public function destroy(Session $session): JsonResponse
    {
        try {
            $session->delete();
            return response()->json([
                'message' => 'Session deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's sessions
     */
    public function today(): JsonResponse
    {
        $sessions = Session::with(['teacher', 'attendances'])
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();

        $transformedSessions = $sessions->map(function ($session) {
            return $this->transformSession($session);
        });

        return response()->json([
            'data' => $transformedSessions
        ]);
    }

    /**
     * Get session statistics
     */
    public function stats(): JsonResponse
    {
        $today = today();
        
        $stats = [
            'today_sessions' => Session::whereDate('start_time', $today)->count(),
            'completed_sessions' => Session::where('status', 'completed')->count(),
            'cancelled_sessions' => Session::where('status', 'cancelled')->count(),
            'total_attendances' => Attendance::count(),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Transform session data for frontend
     */
    private function transformSession(Session $session): array
    {
        $teacher = $session->teacher;
        $attendances = $session->attendances;
        
        // Determine session type based on teacher pricing
        $sessionType = 'free';
        if ($teacher && $teacher->price_subscription > 0) {
            $sessionType = 'subscription';
        }

        // Calculate revenue (simplified - based on attendances and teacher pricing)
        $revenue = 0;
        if ($teacher && $teacher->price_subscription > 0) {
            $revenue = $attendances->count() * $teacher->price_subscription;
        }

        return [
            'id' => $session->id,
            'teacher_uuid' => $session->teacher_uuid,
            'teacher_name' => $teacher ? $teacher->name : 'غير محدد',
            'module' => $teacher ? $teacher->module : 'غير محدد',
            'year_target' => $session->year_target,
            'branch' => $session->branch ? [
                'id' => $session->branch->id,
                'name' => $session->branch->name,
                'code' => $session->branch->code,
            ] : null,
            'start_time' => $session->start_time->format('Y-m-d H:i:s'),
            'end_time' => $session->end_time->format('Y-m-d H:i:s'),
            'date' => $session->start_time->format('Y-m-d'),
            'time' => $session->start_time->format('H:i'),
            'duration' => $session->durationMinutes() ? round($session->durationMinutes() / 60, 1) . 'س' : 'غير محدد',
            'status' => $this->getStatusInArabic($session->status),
            'type' => $this->getTypeInArabic($sessionType),
            'students_count' => $attendances->count(),
            'revenue' => $revenue . ' دج',
            'room' => 'القاعة ' . chr(65 + ($session->id % 26)) . ($session->id % 10 + 1), // Generate room name
        ];
    }

    /**
     * Get status in Arabic
     */
    private function getStatusInArabic(string $status): string
    {
        return match($status) {
            'completed' => 'مكتملة',
            'cancelled' => 'ملغية',
            default => 'غير محدد'
        };
    }

    /**
     * Get type in Arabic
     */
    private function getTypeInArabic(string $type): string
    {
        return match($type) {
            'subscription' => 'اشتراك',
            'paid' => 'مدفوعة',
            'free' => 'مجانية',
            'ma3fi' => 'معفي',
            default => 'غير محدد'
        };
    }
}
