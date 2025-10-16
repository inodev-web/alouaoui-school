<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompressResponse
{
    /**
     * Handle an incoming request and compress the response with gzip.
     *
     * This middleware significantly reduces response size for API calls,
     * especially beneficial for large payloads (dashboard data, lists).
     *
     * Performance Impact:
     * - Reduces bandwidth by 70-90%
     * - Small CPU overhead (~10-20ms) for compression
     * - Faster download time for clients
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only compress if client accepts gzip encoding
        if (!str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            return $response;
        }

        // Only compress JSON responses (API responses)
        if (!$response->headers->has('Content-Type') ||
            !str_contains($response->headers->get('Content-Type'), 'application/json')) {
            return $response;
        }

        // Don't compress already compressed content
        if ($response->headers->has('Content-Encoding')) {
            return $response;
        }

        // Don't compress empty responses
        $content = $response->getContent();
        if (empty($content)) {
            return $response;
        }

        // Only compress responses larger than 1KB (compression overhead not worth it for small responses)
        if (strlen($content) < 1024) {
            return $response;
        }

        // Compress the content
        $compressed = gzencode($content, 6); // Level 6 = good balance between compression and speed

        if ($compressed === false) {
            // Compression failed, return original response
            return $response;
        }

        // Update response with compressed content
        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', strlen($compressed));
        $response->headers->set('Vary', 'Accept-Encoding'); // For caching proxies

        return $response;
    }
}
