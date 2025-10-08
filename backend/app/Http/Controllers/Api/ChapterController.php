<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

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
        $yearOfStudy = $request->get('year_of_study');

    $query = Chapter::with(['courses']);

        // Recherche
        if ($search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // Filtres
        if ($yearOfStudy) {
            $query->where('year_target', $yearOfStudy);
        }

        // Appliquer les restrictions d'accès pour les étudiants
        if ($user && $user->role === 'student') {
            // Access control currently grants all chapters for free or active subscriptions.
            // Placeholder: no filtering since chapters are global in simplified model.
        }

        $chapters = $query->orderBy('created_at', 'desc')->paginate($perPage);

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
            'year_target' => 'required|string|in:1AM,2AM,3AM,4AM,1AS,2AS,3AS',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $chapterData = $request->only([
            'title', 'description', 'year_target'
        ]);

        // Tous les chapitres appartiennent automatiquement à Alouaoui
        // Plus besoin de teacher_name car il est implicite

        $chapter = Chapter::create($chapterData);
        $chapter->load(['courses']);

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
        // Simplified: all chapters visible; detailed access logic removed.
        $chapter->load(['courses']);

        // Ajouter les informations d'accès pour l'étudiant
        $responseData = $chapter->toArray();
        // Access info simplified: all visible for now
        if ($user && $user->role === 'student') {
            $responseData['access_info'] = [
                'can_access' => true,
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
            'year_target' => 'sometimes|string|in:1AM,2AM,3AM,4AM,1AS,2AS,3AS',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['title','description','year_target']);

        $chapter->update($updateData);
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
        $chapter->delete();

        return response()->json([
            'message' => 'Chapter deleted successfully'
        ]);
    }

    /**
     * Get chapters by teacher
     */
    // Removed byTeacher endpoint; chapters not linked to teacher entity in simplified model.

    /**
     * Toggle chapter status (Admin only)
     */
    // Removed toggleStatus due to absence of is_active field in simplified schema.

    /**
     * Reorder chapters (Admin only)
     */
    // Removed reorder (no order_index field maintained now).
}
