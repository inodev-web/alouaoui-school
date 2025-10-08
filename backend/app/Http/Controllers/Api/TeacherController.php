<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

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
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('name')->paginate($perPage);

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
            'phone' => 'required|string|max:20|unique:teachers,phone',
            'module' => 'sometimes|string|max:255',
            'year' => 'sometimes|string|max:10',
            'is_online_publisher' => 'sometimes|boolean',
            'price_subscription' => 'sometimes|numeric|min:0',
            'price_session' => 'sometimes|numeric|min:0',
            'percent_school' => 'sometimes|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $teacher = Teacher::create($validator->validated());

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
            'phone' => 'sometimes|string|max:20|unique:teachers,phone,' . $teacher->uuid . ',uuid',
            'module' => 'sometimes|string|max:255',
            'year' => 'sometimes|string|max:10',
            'is_online_publisher' => 'sometimes|boolean',
            'price_subscription' => 'sometimes|numeric|min:0',
            'price_session' => 'sometimes|numeric|min:0',
            'percent_school' => 'sometimes|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $teacher->update($validator->validated());

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
        $teacher->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully'
        ]);
    }

    /**
     * Toggle teacher active status
     */
    // Removed toggleStatus, statistics, active endpoints due to simplified schema.
}
