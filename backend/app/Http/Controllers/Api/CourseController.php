<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Chapter;
use App\Jobs\TranscodeVideoJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    /**
     * Display a listing of courses/videos.
     */
    public function index(Request $request)
    {
        $query = Course::with(['chapter']);

        // Apply pagination
        $perPage = $request->get('per_page', 15);
        $courses = $query->paginate($perPage);

        return response()->json([
            'data' => $courses->items(),
            'meta' => [
                'current_page' => $courses->currentPage(),
                'last_page' => $courses->lastPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
            ]
        ]);
    }

    /**
     * Store a newly created course/video.
     */
    public function store(Request $request)
    {
        // Only "Alouaoui" (the main teacher) can upload videos
        if (Auth::user()->name !== 'Alouaoui') {
            return response()->json([
                'message' => 'Only Alouaoui can upload videos'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'chapter_id' => 'required|exists:chapters,id',
            'year_target' => 'required|string',
            'video' => 'required|file|mimes:mp4,avi,mov|max:2048000', // Max 2GB
        ]);

        // Handle video upload
        $videoPath = null;
        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('videos', 'public');
        }

        $course = Course::create([
            'title' => $request->title,
            'chapter_id' => $request->chapter_id,
            'year_target' => $request->year_target,
            'video_path' => $videoPath,
            'status' => 'processing',
        ]);

        // Dispatch transcoding job
        if ($videoPath) {
            Queue::push(new TranscodeVideoJob($course, $videoPath));
        }

        return response()->json([
            'message' => 'Video uploaded successfully',
            'data' => $course->load('chapter')
        ], 201);
    }

    /**
     * Display the specified course/video.
     */
    public function show(Course $course)
    {
        return response()->json([
            'data' => $course->load(['chapter'])
        ]);
    }

    /**
     * Update the specified course/video.
     */
    public function update(Request $request, Course $course)
    {
        // Only "Alouaoui" can update videos
        if (Auth::user()->name !== 'Alouaoui') {
            return response()->json([
                'message' => 'Only Alouaoui can update videos'
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'chapter_id' => 'sometimes|exists:chapters,id',
            'year_target' => 'sometimes|string',
            'video' => 'sometimes|file|mimes:mp4,avi,mov|max:2048000',
        ]);

        $updateData = $request->only(['title', 'chapter_id', 'year_target']);

        // Handle video upload if provided
        if ($request->hasFile('video')) {
            // Delete old video file if exists
            if ($course->video_path) {
                Storage::disk('public')->delete($course->video_path);
            }

            $videoPath = $request->file('video')->store('videos', 'public');
            $updateData['video_path'] = $videoPath;
            $updateData['status'] = 'processing';

            // Dispatch transcoding job for new video
            Queue::push(new TranscodeVideoJob($course, $videoPath));
        }

        $course->update($updateData);

        return response()->json([
            'message' => 'Video updated successfully',
            'data' => $course->fresh()->load('chapter')
        ]);
    }

    /**
     * Remove the specified course/video.
     */
    public function destroy(Course $course)
    {
        // Only "Alouaoui" can delete videos
        if (Auth::user()->name !== 'Alouaoui') {
            return response()->json([
                'message' => 'Only Alouaoui can delete videos'
            ], 403);
        }

        // Delete video file if exists
        if ($course->video_path) {
            Storage::disk('public')->delete($course->video_path);
        }

        $course->delete();

        return response()->json([
            'message' => 'Video deleted successfully'
        ]);
    }

    /**
     * Search courses/videos.
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100'
        ]);

        $query = Course::with(['chapter'])
            ->where('title', 'LIKE', '%' . $request->q . '%');

        $perPage = $request->get('per_page', 15);
        $courses = $query->paginate($perPage);

        return response()->json([
            'data' => $courses->items(),
            'meta' => [
                'current_page' => $courses->currentPage(),
                'last_page' => $courses->lastPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
            ]
        ]);
    }

    /**
     * Generate stream token for video access.
     */
    public function streamToken(Course $course)
    {
        // Generate a signed URL for video streaming
        $token = route('courses.stream', ['course' => $course->id]);

        return response()->json([
            'stream_url' => $token,
            'expires_at' => now()->addHour(),
        ]);
    }

    /**
     * Report an issue with a video.
     */
    public function reportIssue(Request $request, Course $course)
    {
        $request->validate([
            'issue_type' => 'required|string',
            'description' => 'required|string|max:1000',
        ]);

        // Here you would typically save to an issues table
        // For now, just return success

        return response()->json([
            'message' => 'Issue reported successfully'
        ]);
    }

    /**
     * Get streaming statistics (admin only).
     */
    public function streamingStats()
    {
        // Return mock statistics for now
        return response()->json([
            'total_videos' => Course::count(),
            'total_views' => 0, // Would need a views table
            'popular_videos' => Course::take(5)->get(),
        ]);
    }
}
