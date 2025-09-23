<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ScannerLock
{
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

        // Generate lock key based on user/scanner ID
        $lockKey = "scanner:{$user->id}";
        $lockTtl = 30; // 30 seconds lock duration
        $maxWaitTime = 5; // Maximum wait time in seconds
        $waitInterval = 0.1; // Check every 100ms

        try {
            // Check if Redis is available
            if (!$this->isRedisAvailable()) {
                // Fallback: use cache if Redis is not available
                return $this->handleWithCache($request, $next, $lockKey, $lockTtl);
            }

            // Try to acquire lock with timeout
            $acquired = false;
            $startTime = microtime(true);

            while (!$acquired && (microtime(true) - $startTime) < $maxWaitTime) {
                // Try to set lock with NX (only if not exists) and EX (expiration)
                $acquired = Redis::set($lockKey, json_encode([
                    'user_id' => $user->id,
                    'locked_at' => now()->toISOString(),
                    'request_id' => uniqid(),
                    'user_agent' => $request->userAgent(),
                    'ip' => $request->ip()
                ]), 'EX', $lockTtl, 'NX');

                if (!$acquired) {
                    // Check if existing lock is expired (safety mechanism)
                    $existingLock = Redis::get($lockKey);
                    if ($existingLock) {
                        $lockData = json_decode($existingLock, true);
                        $lockedAt = \Carbon\Carbon::parse($lockData['locked_at']);
                        
                        // If lock is older than TTL + 5 seconds, force release it
                        if ($lockedAt->addSeconds($lockTtl + 5)->isPast()) {
                            Redis::del($lockKey);
                            \Log::warning("Force released expired scanner lock for user {$user->id}");
                            continue; // Try again
                        }
                    }

                    // Wait before retrying
                    usleep($waitInterval * 1000000); // Convert to microseconds
                }
            }

            if (!$acquired) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scanner occupé. Un autre scan est en cours.',
                    'error_code' => 'SCANNER_BUSY',
                    'retry_after' => $lockTtl
                ], 429); // Too Many Requests
            }

            // Store lock key in request for cleanup
            $request->merge(['scanner_lock_key' => $lockKey]);

            // Process the request
            $response = $next($request);

            // Release lock after successful processing
            Redis::del($lockKey);

            return $response;

        } catch (\Exception $e) {
            // Always try to release lock on exception
            if (isset($lockKey)) {
                try {
                    Redis::del($lockKey);
                } catch (\Exception $cleanupException) {
                    \Log::error("Failed to cleanup scanner lock: " . $cleanupException->getMessage());
                }
            }

            \Log::error("Scanner lock middleware error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du verrouillage du scanner',
                'error_code' => 'SCANNER_LOCK_ERROR'
            ], 500);
        }
    }

    /**
     * Check if Redis is available
     */
    private function isRedisAvailable(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            \Log::warning("Redis not available, falling back to cache: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fallback mechanism using Laravel cache if Redis is not available
     */
    private function handleWithCache(Request $request, Closure $next, string $lockKey, int $lockTtl): Response
    {
        $user = Auth::user();
        
        try {
            // Check if lock exists in cache
            if (\Cache::has($lockKey)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scanner occupé (mode cache). Veuillez réessayer.',
                    'error_code' => 'SCANNER_BUSY_CACHE',
                    'retry_after' => $lockTtl
                ], 429);
            }

            // Set lock in cache
            \Cache::put($lockKey, [
                'user_id' => $user->id,
                'locked_at' => now()->toISOString(),
                'mode' => 'cache_fallback'
            ], $lockTtl);

            // Process request
            $response = $next($request);

            // Release cache lock
            \Cache::forget($lockKey);

            return $response;

        } catch (\Exception $e) {
            // Cleanup on exception
            \Cache::forget($lockKey);
            
            \Log::error("Scanner cache lock error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du verrouillage du scanner (cache)',
                'error_code' => 'SCANNER_CACHE_ERROR'
            ], 500);
        }
    }

    /**
     * Handle middleware termination (cleanup if needed)
     */
    public function terminate(Request $request, Response $response): void
    {
        // Final cleanup attempt if lock key is still in request
        $lockKey = $request->get('scanner_lock_key');
        
        if ($lockKey) {
            try {
                if ($this->isRedisAvailable()) {
                    Redis::del($lockKey);
                } else {
                    \Cache::forget($lockKey);
                }
            } catch (\Exception $e) {
                \Log::error("Scanner lock cleanup error in terminate: " . $e->getMessage());
            }
        }
    }
}
