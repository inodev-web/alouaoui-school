<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;

class TeacherController extends Controller
{
    public function __construct()
    {
        // Middleware is now applied in routes/api.php
    }

    /**
     * Display a listing of teachers
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');

        $query = Teacher::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
        }

        $teachers = $query->with(['chapters' => function($query) {
            $query->select('id', 'title', 'teacher_id');
        }])
        ->withCount('chapters')
        ->orderBy('name')
        ->paginate($perPage);

        return response()->json([
            'data' => $teachers->items(),
            'meta' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ]
        ]);
    }

    /**
     * Store a newly created teacher
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:teachers',
            'phone' => 'required|string|max:20|unique:teachers',
            'specialization' => 'required|string|max:255',
            'bio' => 'sometimes|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $teacher = Teacher::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'specialization' => $request->specialization,
            'bio' => $request->bio,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'Teacher created successfully',
            'data' => $teacher
        ], 201);
    }

    /**
     * Display the specified teacher
     */
    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load([
            'chapters' => function($query) {
                $query->with(['course:id,title'])
                      ->select('id', 'title', 'description', 'teacher_id', 'course_id', 'video_url', 'created_at');
            }
        ]);

        $teacher->loadCount('chapters');

        return response()->json([
            'data' => $teacher
        ]);
    }

    /**
     * Update the specified teacher
     */
    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:teachers,email,' . $teacher->id,
            'phone' => 'sometimes|string|max:20|unique:teachers,phone,' . $teacher->id,
            'specialization' => 'sometimes|string|max:255',
            'bio' => 'sometimes|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $teacher->update($request->only([
            'name', 'email', 'phone', 'specialization', 'bio', 'is_active'
        ]));

        return response()->json([
            'message' => 'Teacher updated successfully',
            'data' => $teacher->fresh()
        ]);
    }

    /**
     * Remove the specified teacher
     */
    public function destroy(Teacher $teacher): JsonResponse
    {
        // Vérifier s'il y a des chapitres associés
        if ($teacher->chapters()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete teacher with associated chapters. Please reassign or delete chapters first.'
            ], 422);
        }

        $teacher->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully'
        ]);
    }

    /**
     * Toggle teacher active status
     */
    public function toggleStatus(Teacher $teacher): JsonResponse
    {
        $teacher->update([
            'is_active' => !$teacher->is_active
        ]);

        return response()->json([
            'message' => 'Teacher status updated successfully',
            'data' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'is_active' => $teacher->is_active
            ]
        ]);
    }

    /**
     * Get teacher statistics
     */
    public function statistics(Teacher $teacher): JsonResponse
    {
        $stats = [
            'total_chapters' => $teacher->chapters()->count(),
            'active_chapters' => $teacher->chapters()->where('is_active', true)->count(),
            'total_courses' => $teacher->chapters()
                ->join('courses', 'chapters.course_id', '=', 'courses.id')
                ->distinct('courses.id')
                ->count(),
            'recent_chapters' => $teacher->chapters()
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Get all active teachers (simple list)
     */
    public function active(): JsonResponse
    {
        $teachers = Teacher::where('is_active', true)
            ->select('id', 'name', 'specialization')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $teachers
        ]);
    }
}
