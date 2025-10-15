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
        // Eager load relations with only necessary columns to reduce query size
        $query = Session::with([
            'teacher:uuid,name,picture,module',
            'branch:id,name,code,year_level',
            'branches:id,name,code,year_level',
            'attendances:id,session_id,student_uuid'
        ]);

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
            $branchId = (int) $request->branch_id;
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereHas('branches', function ($branchQuery) use ($branchId) {
                      $branchQuery->where('branches.id', $branchId);
                  });
            });
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
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'integer|exists:branches,id',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'status' => 'nullable|in:' . implode(',', Session::STATUSES),
            'cancel_reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->filled('status') && $request->status === 'cancelled' && !$request->filled('cancel_reason')) {
            return response()->json([
                'message' => 'يجب تحديد سبب للإلغاء',
                'errors' => ['cancel_reason' => ['الرجاء اختيار سبب لإلغاء الجلسة']],
            ], 422);
        }

        if ($request->filled('cancel_reason') && $request->input('status') !== 'cancelled') {
            return response()->json([
                'message' => 'لا يمكن حفظ سبب الإلغاء بدون إلغاء الجلسة',
                'errors' => ['cancel_reason' => ['قم بإلغاء الجلسة أولاً قبل تحديد السبب']],
            ], 422);
        }

        $branchIds = collect($request->input('branch_ids', []))
            ->filter(function ($id) {
                return $id !== null && $id !== '';
            })
            ->map(function ($id) {
                return (int) $id;
            })
            ->unique()
            ->values();

        if ($request->filled('branch_id')) {
            $branchIds->push((int) $request->branch_id);
            $branchIds = $branchIds->unique()->values();
        }

        $yearTarget = $request->year_target;
        $isHighSchool = in_array($yearTarget, ['1AS', '2AS', '3AS']);

        if ($isHighSchool) {
            if ($branchIds->isEmpty()) {
                return response()->json([
                    'message' => 'يجب اختيار فرع واحد على الأقل لهذه السنة',
                    'errors' => ['branch_ids' => ['يجب اختيار فرع واحد على الأقل لهذه السنة']]
                ], 422);
            }

            $hasInvalidBranch = Branch::whereIn('id', $branchIds->all())
                ->where(function ($branchQuery) use ($yearTarget) {
                    $branchQuery->where('year_level', '!=', $yearTarget)
                        ->orWhereNull('year_level');
                })
                ->exists();

            if ($hasInvalidBranch) {
                return response()->json([
                    'message' => 'الفروع المحددة لا تتطابق مع السنة المستهدفة',
                    'errors' => ['branch_ids' => ['الفروع المحددة لا تتطابق مع السنة المستهدفة']]
                ], 422);
            }
        } else {
            $branchIds = collect();
        }

        $primaryBranchId = $isHighSchool ? $branchIds->first() : null;

        try {
            $session = Session::create([
                'teacher_uuid' => $request->teacher_uuid,
                'year_target' => $request->year_target,
                'branch_id' => $primaryBranchId,
                'start_time' => Carbon::parse($request->start_time),
                'end_time' => Carbon::parse($request->end_time),
                'status' => $request->input('status'),
                'cancel_reason' => $request->input('status') === 'cancelled'
                    ? $request->input('cancel_reason')
                    : null,
            ]);

            $session->branches()->sync($branchIds->all());

            return response()->json([
                'message' => 'Session created successfully',
                'data' => $this->transformSession($session->load(['teacher', 'attendances', 'branch', 'branches']))
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
            'data' => $this->transformSession($session->load(['teacher', 'attendances', 'branch', 'branches']))
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
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'integer|exists:branches,id',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'status' => 'nullable|in:' . implode(',', Session::STATUSES),
            'cancel_reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->filled('status') && $request->status === 'cancelled' && !$request->filled('cancel_reason')) {
            return response()->json([
                'message' => 'يجب تحديد سبب للإلغاء',
                'errors' => ['cancel_reason' => ['الرجاء اختيار سبب لإلغاء الجلسة']],
            ], 422);
        }

        if ($request->filled('cancel_reason') && $request->input('status', $session->status) !== 'cancelled') {
            return response()->json([
                'message' => 'لا يمكن حفظ سبب الإلغاء بدون إلغاء الجلسة',
                'errors' => ['cancel_reason' => ['قم بإلغاء الجلسة أولاً قبل تحديد السبب']],
            ], 422);
        }

        $yearTarget = $request->input('year_target', $session->year_target);
        $isHighSchool = in_array($yearTarget, ['1AS', '2AS', '3AS']);
        $branchDataProvided = $request->has('branch_ids') || $request->has('branch_id');

        $branchIds = collect();

        if ($branchDataProvided) {
            $branchIds = collect($request->input('branch_ids', []))
                ->filter(function ($id) {
                    return $id !== null && $id !== '';
                })
                ->map(function ($id) {
                    return (int) $id;
                })
                ->unique()
                ->values();

            if ($request->filled('branch_id')) {
                $branchIds->push((int) $request->branch_id);
                $branchIds = $branchIds->unique()->values();
            }
        }

        $shouldSyncBranches = $branchDataProvided || !$isHighSchool;

        if ($isHighSchool && $shouldSyncBranches) {
            if ($branchIds->isEmpty()) {
                return response()->json([
                    'message' => 'يجب اختيار فرع واحد على الأقل لهذه السنة',
                    'errors' => ['branch_ids' => ['يجب اختيار فرع واحد على الأقل لهذه السنة']]
                ], 422);
            }

            $hasInvalidBranch = Branch::whereIn('id', $branchIds->all())
                ->where(function ($branchQuery) use ($yearTarget) {
                    $branchQuery->where('year_level', '!=', $yearTarget)
                        ->orWhereNull('year_level');
                })
                ->exists();

            if ($hasInvalidBranch) {
                return response()->json([
                    'message' => 'الفروع المحددة لا تتطابق مع السنة المستهدفة',
                    'errors' => ['branch_ids' => ['الفروع المحددة لا تتطابق مع السنة المستهدفة']]
                ], 422);
            }
        }

        if ($isHighSchool && !$shouldSyncBranches) {
            $hasInvalidExisting = $session->branches()
                ->where(function ($branchQuery) use ($yearTarget) {
                    $branchQuery->where('year_level', '!=', $yearTarget)
                        ->orWhereNull('year_level');
                })
                ->exists();

            if ($hasInvalidExisting) {
                return response()->json([
                    'message' => 'الفروع الحالية لا تتطابق مع السنة الجديدة، يرجى اختيار الفروع المناسبة',
                    'errors' => ['branch_ids' => ['الفروع الحالية لا تتطابق مع السنة الجديدة']]
                ], 422);
            }
        }

        if (!$isHighSchool) {
            $branchIds = collect();
        }

        $primaryBranchId = $shouldSyncBranches
            ? ($isHighSchool ? $branchIds->first() : null)
            : $session->branch_id;

        try {
            $updateData = $request->only(['teacher_uuid', 'year_target', 'status']);
            if ($shouldSyncBranches || $request->has('branch_id')) {
                $updateData['branch_id'] = $primaryBranchId;
            }

            if ($request->has('start_time')) {
                $updateData['start_time'] = Carbon::parse($request->start_time);
            }
            if ($request->has('end_time')) {
                $updateData['end_time'] = Carbon::parse($request->end_time);
            }

            if (array_key_exists('status', $updateData)) {
                $statusValue = $request->input('status');
                $updateData['status'] = $statusValue;
                if ($statusValue !== 'cancelled') {
                    $updateData['cancel_reason'] = null;
                }
            }

            if ($request->filled('cancel_reason') && $request->input('status', $session->status) === 'cancelled') {
                $updateData['cancel_reason'] = $request->input('cancel_reason');
            }

            $session->update($updateData);

            if ($shouldSyncBranches) {
                $session->branches()->sync($branchIds->all());
            }

            return response()->json([
                'message' => 'Session updated successfully',
                'data' => $this->transformSession($session->load(['teacher', 'attendances', 'branch', 'branches']))
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
        $sessions = Session::with(['teacher', 'attendances', 'branch', 'branches'])
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
        $branchesCollection = $session->relationLoaded('branches')
            ? $session->branches
            : $session->branches()->get();

        $branchesData = $branchesCollection->map(function ($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
            ];
        })->values();

        $primaryBranch = $session->branch ?: $branchesCollection->first();
        $statusRaw = $session->status;
        $needsStatusConfirmation = !$statusRaw
            && $session->end_time
            && $session->end_time->lessThanOrEqualTo(now());

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
            'branch' => $primaryBranch ? [
                'id' => $primaryBranch->id,
                'name' => $primaryBranch->name,
                'code' => $primaryBranch->code,
            ] : null,
            'branches' => $branchesData->toArray(),
            'branch_ids' => $branchesData->pluck('id')->toArray(),
            'start_time' => $session->start_time->format('Y-m-d H:i:s'),
            'end_time' => $session->end_time->format('Y-m-d H:i:s'),
            'date' => $session->start_time->format('Y-m-d'),
            'time' => $session->start_time->format('H:i'),
            'duration' => $session->durationMinutes() ? round($session->durationMinutes() / 60, 1) . 'س' : 'غير محدد',
            'status' => $this->getStatusInArabic($statusRaw),
            'status_raw' => $statusRaw,
            'cancel_reason' => $session->cancel_reason,
            'needs_status_confirmation' => $needsStatusConfirmation,
            'type' => $this->getTypeInArabic($sessionType),
            'students_count' => $attendances->count(),
            'revenue' => $revenue . ' دج',
            'room' => 'القاعة ' . chr(65 + ($session->id % 26)) . ($session->id % 10 + 1), // Generate room name
        ];
    }

    /**
     * Get status in Arabic
     */
    private function getStatusInArabic(?string $status): string
    {
        if ($status === null) {
            return 'بانتظار التأكيد';
        }

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
