<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Teacher;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ChapterController extends Controller
{
    protected AccessControlService $accessControl;

    public function __construct(AccessControlService $accessControlService)
    {
        $this->accessControl = $accessControlService;
    }


    /**
     * Display a listing of chapters
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $teacherId = $request->get('teacher_id');
        $courseId = $request->get('course_id');
        $yearOfStudy = $request->get('year_of_study');

        $query = Chapter::with(['teacher:id,name', 'course:id,title']);

        // Recherche
        if ($search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // Filtres
        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        if ($yearOfStudy) {
            $query->whereHas('course', function($q) use ($yearOfStudy) {
                $q->where('year_of_study', $yearOfStudy);
            });
        }

        // Appliquer les restrictions d'accès pour les étudiants
        if ($user->role === 'student') {
            $accessibleChapters = $this->accessControl->getAccessibleChapters($user);
            $query->whereIn('id', $accessibleChapters);
        }

        $chapters = $query->where('is_active', true)
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $chapters->items(),
            'meta' => [
                'current_page' => $chapters->currentPage(),
                'last_page' => $chapters->lastPage(),
                'per_page' => $chapters->perPage(),
                'total' => $chapters->total(),
            ]
        ]);
    }

    /**
     * Store a newly created chapter (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'teacher_id' => 'required|exists:teachers,id',
            'course_id' => 'required|exists:courses,id',
            'video_url' => 'sometimes|string|max:500',
            'video_file' => 'sometimes|file|mimes:mp4,mov,avi,wmv|max:512000', // 500MB
            'duration_minutes' => 'sometimes|integer|min:1',
            'order_index' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $chapterData = $request->only([
            'title', 'description', 'teacher_id', 'course_id',
            'video_url', 'duration_minutes', 'order_index', 'is_active'
        ]);

        // Upload video file if provided
        if ($request->hasFile('video_file')) {
            $videoPath = $request->file('video_file')->store('chapters/videos', 's3');
            $chapterData['video_url'] = $videoPath; // Store path, not full URL
        }

        // Set default order if not provided
        if (!isset($chapterData['order_index'])) {
            $chapterData['order_index'] = Chapter::where('course_id', $request->course_id)->max('order_index') + 1;
        }

        $chapter = Chapter::create($chapterData);
        $chapter->load(['teacher:id,name', 'course:id,title']);

        return response()->json([
            'message' => 'Chapter created successfully',
            'data' => $chapter
        ], 201);
    }

    /**
     * Display the specified chapter
     */
    public function show(Request $request, Chapter $chapter): JsonResponse
    {
        $user = $request->user();

        // Vérifier l'accès pour les étudiants
        if ($user->role === 'student') {
            if (!$this->accessControl->canAccessChapter($user, $chapter)) {
                return response()->json(['message' => 'Access denied to this chapter'], 403);
            }
        }

        $chapter->load(['teacher:id,name,specialization', 'course:id,title,year_of_study']);

        // Ajouter les informations d'accès pour l'étudiant
        $responseData = $chapter->toArray();
        if ($user->role === 'student') {
            $responseData['access_info'] = [
                'can_access' => true,
                'access_type' => $this->accessControl->getAccessType($user, $chapter),
                'subscription_status' => $this->accessControl->getSubscriptionStatus($user),
            ];
        }

        return response()->json([
            'data' => $responseData
        ]);
    }

    /**
     * Update the specified chapter (Admin only)
     */
    public function update(Request $request, Chapter $chapter): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'teacher_id' => 'sometimes|exists:teachers,id',
            'course_id' => 'sometimes|exists:courses,id',
            'video_url' => 'sometimes|string|max:500',
            'video_file' => 'sometimes|file|mimes:mp4,mov,avi,wmv|max:512000',
            'duration_minutes' => 'sometimes|integer|min:1',
            'order_index' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'title', 'description', 'teacher_id', 'course_id',
            'video_url', 'duration_minutes', 'order_index', 'is_active'
        ]);

        // Upload new video file if provided
        if ($request->hasFile('video_file')) {
            // Delete old video file if exists
            if ($chapter->video_url && str_contains($chapter->video_url, 'chapters/videos/')) {
                Storage::disk('s3')->delete($chapter->video_url);
            }

            $videoPath = $request->file('video_file')->store('chapters/videos', 's3');
            $updateData['video_url'] = $videoPath; // Store path, not full URL
        }

        $chapter->update($updateData);
        $chapter->load(['teacher:id,name', 'course:id,title']);

        return response()->json([
            'message' => 'Chapter updated successfully',
            'data' => $chapter->fresh()
        ]);
    }

    /**
     * Remove the specified chapter (Admin only)
     */
    public function destroy(Request $request, Chapter $chapter): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete video file if exists
        if ($chapter->video_url && str_contains($chapter->video_url, 'chapters/videos/')) {
            Storage::disk('s3')->delete($chapter->video_url);
        }

        $chapter->delete();

        return response()->json([
            'message' => 'Chapter deleted successfully'
        ]);
    }

    /**
     * Get chapters by teacher
     */
    public function byTeacher(Request $request, Teacher $teacher): JsonResponse
    {
        $user = $request->user();

        $query = $teacher->chapters()->with(['course:id,title'])->where('is_active', true);

        // Appliquer les restrictions d'accès pour les étudiants
        if ($user->role === 'student') {
            $accessibleChapters = $this->accessControl->getAccessibleChapters($user);
            $query->whereIn('id', $accessibleChapters);
        }

        $chapters = $query->orderBy('order_index')->get();

        return response()->json([
            'data' => $chapters,
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'specialization' => $teacher->specialization,
            ]
        ]);
    }

    /**
     * Toggle chapter status (Admin only)
     */
    public function toggleStatus(Request $request, Chapter $chapter): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chapter->update([
            'is_active' => !$chapter->is_active
        ]);

        return response()->json([
            'message' => 'Chapter status updated successfully',
            'data' => [
                'id' => $chapter->id,
                'title' => $chapter->title,
                'is_active' => $chapter->is_active
            ]
        ]);
    }

    /**
     * Reorder chapters (Admin only)
     */
    public function reorder(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'chapters' => 'required|array',
            'chapters.*.id' => 'required|exists:chapters,id',
            'chapters.*.order_index' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->chapters as $chapterData) {
            Chapter::where('id', $chapterData['id'])
                   ->update(['order_index' => $chapterData['order_index']]);
        }

        return response()->json([
            'message' => 'Chapters reordered successfully'
        ]);
    }
}
