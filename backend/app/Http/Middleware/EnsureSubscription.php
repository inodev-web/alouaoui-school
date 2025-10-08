<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Extract teacher UUID from route parameters or request
        $teacherUuid = $this->extractTeacherUuid($request);

        if (!$teacherUuid) {
            return response()->json([
                'success' => false,
                'message' => 'Enseignant non identifié',
                'error_code' => 'TEACHER_NOT_FOUND'
            ], 400);
        }

        // Check video access using simplified logic
        if (!$this->accessControl->hasVideoAccess($user, $teacherUuid)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à ce contenu vidéo',
                'error_code' => 'ACCESS_DENIED',
                'teacher_uuid' => $teacherUuid,
                'free_subscriber' => $user->isFree(),
            ], 403);
        }

        return $next($request);
    }

    /**
     * Extract teacher UUID from route parameters or request
     */
    private function extractTeacherUuid(Request $request): ?string
    {
        // Try different route parameter names
        $teacherUuid = $request->route('teacher_uuid')
                    ?? $request->route('teacherUuid')
                    ?? $request->route('teacher');

        // If it's a model binding, get the UUID
        if (is_object($teacherUuid) && method_exists($teacherUuid, 'getAttribute')) {
            return $teacherUuid->getAttribute('uuid');
        }

        // Check request body for teacher_uuid
        if ($request->has('teacher_uuid')) {
            return $request->input('teacher_uuid');
        }

        return $teacherUuid;
    }
}
