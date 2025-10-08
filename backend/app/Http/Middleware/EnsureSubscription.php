<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Teacher;
use App\Models\Subscription;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscription
{
    /**
     * Handle an incoming request.
     * Vérifie que l'utilisateur a un abonnement actif à Alouaoui ou est un utilisateur gratuit.
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

        // Check if user is free subscriber
        if ($user->isFree()) {
            return $next($request);
        }

        // Check if user has any active subscription (since all content belongs to Alouaoui)
        $hasActiveSubscription = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', Teacher::ALOUAOUI_UUID)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();

        if (!$hasActiveSubscription) {
            return response()->json([
                'success' => false,
                'message' => 'Abonnement actif à Alouaoui requis pour accéder à ce contenu',
                'error_code' => 'SUBSCRIPTION_REQUIRED',
                'teacher' => 'Alouaoui',
                'free_subscriber' => $user->isFree(),
            ], 403);
        }

        return $next($request);
    }
}
