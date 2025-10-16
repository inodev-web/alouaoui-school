<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Get all students with basic info for table display
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Start with optimized query - select only needed fields
            $query = User::select(['uuid', 'firstname', 'lastname', 'phone', 'birth_date', 'year_of_study', 'branch_id', 'picture', 'created_at'])
                ->with('branch:id,name,code,year_level')  // Specify only needed columns
                ->where('role', 'student');

            // General search filter with optimized OR conditions
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                      ->orWhere('lastname', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Individual filters (for backward compatibility)
            if ($request->filled('firstname')) {
                $query->where('firstname', 'like', '%' . $request->firstname . '%');
            }

            if ($request->filled('lastname')) {
                $query->where('lastname', 'like', '%' . $request->lastname . '%');
            }

            if ($request->filled('phone')) {
                $query->where('phone', 'like', '%' . $request->phone . '%');
            }

            if ($request->filled('year_of_study')) {
                $query->where('year_of_study', $request->year_of_study);
            }

            // Optimized pagination with index
            $perPage = min($request->get('per_page', 15), 50); // Limit max per page
            $students = $query->orderBy('id', 'desc')->paginate($perPage);

            // Direct transform without collection manipulation
            $transformedData = $students->getCollection()->map(function ($student) {
                return [
                    'id' => $student->uuid,
                    'firstname' => $student->firstname,
                    'lastname' => $student->lastname,
                    'phone' => $student->phone,
                    'birth_date' => $student->birth_date ? $student->birth_date->format('Y-m-d') : null,
                    'year_of_study' => $student->year_of_study,
                    'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
                    'branch' => $student->branch ? [
                        'id' => $student->branch->id,
                        'name' => $student->branch->name,
                        'code' => $student->branch->code,
                    ] : null,
                ];
            });

            return response()->json([
                'data' => $transformedData,
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
                'from' => $students->firstItem(),
                'to' => $students->lastItem(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in UserController@index: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch students',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get student statistics for dashboard
     */
    public function stats(): JsonResponse
    {
        try {
            $totalStudents = User::where('role', 'student')->count();

            $activeSubscribers = User::where('role', 'student')
                ->whereHas('activeSubscriptions')
                ->count();

            $newThisMonth = User::where('role', 'student')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $lastMonthNew = User::where('role', 'student')
                ->whereMonth('created_at', now()->subMonth()->month)
                ->whereYear('created_at', now()->subMonth()->year)
                ->count();

            $growthRate = $lastMonthNew > 0
                ? round((($newThisMonth - $lastMonthNew) / $lastMonthNew) * 100, 1)
                : 0;

            // Simplified average sessions calculation
            $totalAttendances = DB::table('attendances')
                ->join('users', 'attendances.student_uuid', '=', 'users.uuid')
                ->where('users.role', 'student')
                ->whereMonth('attendances.created_at', now()->month)
                ->whereYear('attendances.created_at', now()->year)
                ->count();

            $studentsWithAttendances = DB::table('attendances')
                ->join('users', 'attendances.student_uuid', '=', 'users.uuid')
                ->where('users.role', 'student')
                ->whereMonth('attendances.created_at', now()->month)
                ->whereYear('attendances.created_at', now()->year)
                ->distinct('attendances.student_uuid')
                ->count();

            $avgSessions = $studentsWithAttendances > 0
                ? round($totalAttendances / $studentsWithAttendances, 1)
                : 0;

            return response()->json([
                'totalStudents' => $totalStudents,
                'activeSubscribers' => $activeSubscribers,
                'subscriberPercentage' => $totalStudents > 0 ? round(($activeSubscribers / $totalStudents) * 100, 1) : 0,
                'newThisMonth' => $newThisMonth,
                'growthRate' => $growthRate,
                'avgSessionsPerMonth' => $avgSessions,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in UserController@stats: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to fetch statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific student details with subscriptions
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $student = User::where('role', 'student')
                ->where('uuid', $uuid)
                ->with(['subscriptions.teacher', 'branch'])
                ->firstOrFail();

            return response()->json([
                'id' => $student->uuid,
                'uuid' => $student->uuid,
                'firstname' => $student->firstname,
                'lastname' => $student->lastname,
                'phone' => $student->phone,
                'birth_date' => $student->birth_date ? Carbon::parse($student->birth_date)->format('Y-m-d') : null,
                'address' => $student->address,
                'school_name' => $student->school_name,
                'year_of_study' => $student->year_of_study,
                'branch' => $student->branch ? [
                    'id' => $student->branch->id,
                    'name' => $student->branch->name,
                    'code' => $student->branch->code,
                ] : null,
                'role' => $student->role,
                'device_uuid' => $student->device_uuid,
                'qr_token' => $student->qr_token,
                'free_subscriber' => $student->free_subscriber,
                'free_subscriber_reason' => $student->free_subscriber_reason,
                'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
                'created_at' => $student->created_at->format('Y-m-d H:i'),
                'updated_at' => $student->updated_at->format('Y-m-d H:i'),
                'subscriptions' => $student->subscriptions->map(function($subscription) {
                    return [
                        'id' => $subscription->id,
                        'teacher_name' => $subscription->teacher?->name ?? 'غير محدد',
                        'teacher_module' => $subscription->teacher?->module ?? 'غير محدد',
                        'starts_at' => $subscription->starts_at ? Carbon::parse($subscription->starts_at)->format('Y-m-d') : null,
                        'ends_at' => $subscription->ends_at ? Carbon::parse($subscription->ends_at)->format('Y-m-d') : null,
                        'is_active' => $subscription->starts_at <= now() && $subscription->ends_at >= now(),
                        'status' => $subscription->starts_at <= now() && $subscription->ends_at >= now() ? 'نشط' : 'منتهي'
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in UserController@show: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch student details',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new student
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'school_name' => 'nullable|string|max:255',
            'year_of_study' => ['nullable', Rule::in(User::YEARS_OF_STUDY)],
            'branch_id' => 'nullable|exists:branches,id',
            'free_subscriber' => 'boolean',
            'free_subscriber_reason' => 'nullable|string|max:255',
            'picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Validate branch_id based on year_of_study
        if (isset($validated['branch_id']) && isset($validated['year_of_study'])) {
            $branch = Branch::find($validated['branch_id']);
            if ($branch && $branch->year_level !== $validated['year_of_study']) {
                return response()->json([
                    'message' => 'الفرع المحدد لا يتطابق مع السنة الدراسية',
                    'errors' => ['branch_id' => ['الفرع المحدد لا يتطابق مع السنة الدراسية']]
                ], 422);
            }
        }

        // Clear branch_id for middle school students
        if (isset($validated['year_of_study']) && in_array($validated['year_of_study'], ['1AM', '2AM', '3AM', '4AM'])) {
            $validated['branch_id'] = null;
        }

        $validated['role'] = 'student';
        if ($request->hasFile('picture')) {
            $validated['picture'] = $request->file('picture')->store('students', 'public');
        }
        $student = User::create($validated);

        return response()->json([
            'message' => 'تم إنشاء حساب الطالب بنجاح',
            'student' => [
                'id' => $student->uuid,
                'name' => trim($student->firstname . ' ' . $student->lastname),
                'phone' => $student->phone,
                'yearOfStudy' => $student->year_of_study,
                'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
            ]
        ], 201);
    }

    /**
     * Update student
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        $student = User::where('role', 'student')
            ->where('uuid', $uuid)
            ->firstOrFail();

        $validated = $request->validate([
            'firstname' => 'sometimes|string|max:255',
            'lastname' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|unique:users,phone,' . $student->uuid . ',uuid',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'school_name' => 'nullable|string|max:255',
            'year_of_study' => ['nullable', Rule::in(User::YEARS_OF_STUDY)],
            'branch_id' => 'nullable|exists:branches,id',
            'free_subscriber' => 'boolean',
            'free_subscriber_reason' => 'nullable|string|max:255',
            'picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Validate branch_id based on year_of_study
        if (isset($validated['branch_id']) && isset($validated['year_of_study'])) {
            $branch = Branch::find($validated['branch_id']);
            if ($branch && $branch->year_level !== $validated['year_of_study']) {
                return response()->json([
                    'message' => 'الفرع المحدد لا يتطابق مع السنة الدراسية',
                    'errors' => ['branch_id' => ['الفرع المحدد لا يتطابق مع السنة الدراسية']]
                ], 422);
            }
        }

        // Clear branch_id for middle school students
        if (isset($validated['year_of_study']) && in_array($validated['year_of_study'], ['1AM', '2AM', '3AM', '4AM'])) {
            $validated['branch_id'] = null;
        }

        if ($request->hasFile('picture')) {
            $validated['picture'] = $request->file('picture')->store('students', 'public');
        }
        $student->update($validated);

        return response()->json([
            'message' => 'تم تحديث بيانات الطالب بنجاح',
            'student' => array_merge($student->toArray(), [
                'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
            ])
        ]);
    }

    /**
     * Delete student
     */
    public function destroy(string $uuid): JsonResponse
    {
        $student = User::where('role', 'student')
            ->where('uuid', $uuid)
            ->firstOrFail();

        // Check if student has active subscriptions
        if ($student->activeSubscriptions()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف طالب لديه اشتراكات نشطة'
            ], 422);
        }

        $student->delete();

        return response()->json([
            'message' => 'تم حذف الطالب بنجاح'
        ]);
    }

    /**
     * Get subscription status for a student
     */
    private function getSubscriptionStatus(User $student): string
    {
        if ($student->free_subscriber) {
            return 'مجاني';
        }

        if ($student->activeSubscriptions()->exists()) {
            return 'نشط';
        }

        if ($student->subscriptions()->exists()) {
            return 'منتهي';
        }

        // Check if it's a new student (trial period)
        $sessionsCount = $student->attendances()->count();
        if ($sessionsCount <= 3) {
            return 'تجريبي';
        }

        return 'غير مشترك';
    }

    /**
     * Toggle free subscriber status
     */
    public function toggleFreeSubscriber(Request $request, string $uuid): JsonResponse
    {
        try {
            $student = User::where('role', 'student')
                ->where('uuid', $uuid)
                ->firstOrFail();

            $student->free_subscriber = !$student->free_subscriber;

            // If enabling free subscriber, handle reason
            if ($student->free_subscriber) {
                $reason = $request->input('reason', 'اشتراك مجاني ممنوح من الإدارة');
                $student->free_subscriber_reason = $reason;
                $message = 'تم تفعيل الاشتراك المجاني بنجاح';
            } else {
                // If disabling, clear the reason
                $student->free_subscriber_reason = null;
                $message = 'تم إلغاء الاشتراك المجاني بنجاح';
            }

            $student->save();

            return response()->json([
                'message' => $message,
                'free_subscriber' => $student->free_subscriber,
                'free_subscriber_reason' => $student->free_subscriber_reason,
                'picture' => $student->picture ? asset('storage/' . ltrim($student->picture, '/')) : null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error toggling free subscriber: ' . $e->getMessage());
            return response()->json([
                'error' => 'فشل في تحديث حالة الاشتراك المجاني',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
