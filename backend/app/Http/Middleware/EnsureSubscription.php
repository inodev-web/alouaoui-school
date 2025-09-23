<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Subscription;
use App\Models\Chapter;
use App\Models\Course;
use App\Services\AccessControlService;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscription
{
    protected AccessControlService $accessControl;

    public function __construct(AccessControlService $accessControl)
    {
        $this->accessControl = $accessControl;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        // Skip subscription check for admin users
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Skip subscription check for non-student users
        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux étudiants'
            ], 403);
        }

        // Extract chapter ID from route parameters
        $chapterId = $this->extractChapterId($request);
        
        if (!$chapterId) {
            return response()->json([
                'success' => false,
                'message' => 'Chapitre non identifié',
                'error_code' => 'CHAPTER_NOT_FOUND'
            ], 400);
        }

        // Get the chapter
        $chapter = Chapter::find($chapterId);
        
        if (!$chapter) {
            return response()->json([
                'success' => false,
                'message' => 'Chapitre introuvable'
            ], 404);
        }

        // Check if user has access to this chapter through AccessControlService
        if (!$this->accessControl->canAccessChapter($user, $chapter)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à ce chapitre',
                'error_code' => 'ACCESS_DENIED'
            ], 403);
        }

        // Check for active subscription to this chapter
        $subscription = Subscription::where('user_id', $user->id)
            ->where('chapter_id', $chapterId)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();

        if (!$subscription) {
            // Check if this is a regular teacher's content (physical only)
            if (!$chapter->teacher->is_alouaoui_teacher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce contenu nécessite une présence physique en cours',
                    'error_code' => 'PHYSICAL_ATTENDANCE_REQUIRED',
                    'chapter_id' => $chapterId,
                    'teacher_name' => $chapter->teacher->name
                ], 403);
            }

            // For Alouaoui teacher content, require subscription
            return response()->json([
                'success' => false,
                'message' => 'Abonnement requis pour accéder à ce contenu',
                'error_code' => 'SUBSCRIPTION_REQUIRED',
                'chapter_id' => $chapterId,
                'chapter_title' => $chapter->title,
                'teacher_name' => $chapter->teacher->name,
                'suggested_action' => 'subscribe'
            ], 402); // Payment Required status code
        }

        // Check if subscription is still valid
        if ($subscription->expires_at <= now()) {
            $subscription->update(['is_active' => false]);
            
            return response()->json([
                'success' => false,
                'message' => 'Votre abonnement a expiré',
                'error_code' => 'SUBSCRIPTION_EXPIRED',
                'expired_at' => $subscription->expires_at,
                'chapter_id' => $chapterId,
                'suggested_action' => 'renew'
            ], 402);
        }

        // Update last accessed time
        $subscription->touch('last_accessed_at');

        // Store subscription info in request for further use
        $request->merge([
            'subscription' => $subscription,
            'chapter' => $chapter
        ]);

        return $next($request);
    }

    /**
     * Extract chapter ID from route parameters
     */
    private function extractChapterId(Request $request): ?int
    {
        // Try different route parameter names
        $chapterId = $request->route('chapter') 
                  ?? $request->route('chapterId')
                  ?? $request->route('chapter_id');

        // If it's a model binding, get the ID
        if (is_object($chapterId)) {
            return $chapterId->id;
        }

        // If it's from a course route, get chapter through course
        $courseId = $request->route('course') ?? $request->route('courseId');
        if ($courseId) {
            if (is_object($courseId)) {
                $courseId = $courseId->id;
            }
            
            $course = Course::find($courseId);
            if ($course) {
                return $course->chapter_id;
            }
        }

        // Check request body for chapter_id
        if ($request->has('chapter_id')) {
            return $request->input('chapter_id');
        }

        return $chapterId ? (int)$chapterId : null;
    }
}
