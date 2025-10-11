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

        // Transform the data to include year_target from chapter
        $coursesData = $courses->getCollection()->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'chapter_id' => $course->chapter_id,
                'year_target' => $course->chapter?->year_target,
                'video_ref' => $course->video_ref,
                'pdf_summary' => $course->pdf_summary,
                'exercises_pdf' => $course->exercises_pdf,
                'created_at' => $course->created_at,
                'updated_at' => $course->updated_at,
                'chapter' => $course->chapter,
            ];
        });

        return response()->json([
            'data' => $coursesData,
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
        // Only admin can create videos (they will be automatically assigned to Alouaoui)
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only admin can create videos'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'chapter_id' => 'required|exists:chapters,id',
            'video' => 'sometimes|file|mimes:mp4,avi,mov|max:2048000', // Max 2GB
            'video_ref' => 'sometimes|string|url|max:500', // YouTube URL or other video URL
            'description' => 'sometimes|string|max:1000',
            'duration' => 'sometimes|string|max:50',
            'pdf_summary' => 'sometimes|file|mimes:pdf|max:10240', // Max 10MB
            'exercises_pdf' => 'sometimes|file|mimes:pdf|max:10240', // Max 10MB
        ]);

        // Handle video upload or URL reference
        $videoRef = null;
        if ($request->hasFile('video')) {
            // File upload
            $videoPath = $request->file('video')->store('videos', 'public');
            $videoRef = basename($videoPath);
        } elseif ($request->filled('video_ref')) {
            // URL reference (YouTube, etc.)
            $videoRef = $request->video_ref;
        } else {
            return response()->json([
                'message' => 'Either video file or video_ref URL is required'
            ], 422);
        }

        // Handle PDF uploads
        $pdfSummaryPath = null;
        $exercisesPdfPath = null;

        if ($request->hasFile('pdf_summary')) {
            $pdfSummaryPath = basename($request->file('pdf_summary')->store('pdfs', 'public'));
        }

        if ($request->hasFile('exercises_pdf')) {
            $exercisesPdfPath = basename($request->file('exercises_pdf')->store('pdfs', 'public'));
        }

        $course = Course::create([
            'title' => $request->title,
            'chapter_id' => $request->chapter_id,
            'video_ref' => $videoRef,
            'description' => $request->description,
            'duration' => $request->duration,
            'pdf_summary' => $pdfSummaryPath,
            'exercises_pdf' => $exercisesPdfPath,
        ]);

        // Dispatch transcoding job only for uploaded files (not URLs)
        if ($videoRef && $request->hasFile('video')) {
            Queue::push(new TranscodeVideoJob($course, $videoRef));
        }

        // Log the created course data for debugging
        \Log::info('Course created with data:', [
            'id' => $course->id,
            'title' => $course->title,
            'video_ref' => $course->video_ref,
            'pdf_summary' => $course->pdf_summary,
            'exercises_pdf' => $course->exercises_pdf
        ]);

        return response()->json([
            'message' => 'Course created successfully',
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
        // Only admin can update videos
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only admin can update videos'
            ], 403);
        }

        // Log received files
        \Log::info('Received files in request:', [
            'hasFile_pdf_summary' => $request->hasFile('pdf_summary'),
            'hasFile_exercises_pdf' => $request->hasFile('exercises_pdf'),
            'all_files' => $request->allFiles(),
            'content_type' => $request->header('Content-Type')
        ]);

        try {
            $request->validate([
                'title' => 'sometimes|string|max:255',
                'chapter_id' => 'sometimes|exists:chapters,id',
                'video' => 'sometimes|file|mimes:mp4,avi,mov|max:2048000',
                'video_ref' => 'sometimes|string|url|max:500',
                'description' => 'sometimes|string|max:1000',
                'duration' => 'sometimes|string|max:50',
                'pdf_summary' => 'sometimes|file|mimes:pdf|max:10240',
                'exercises_pdf' => 'sometimes|file|mimes:pdf|max:10240',
            ]);

            $updateData = $request->only([
                'title', 'chapter_id', 'video_ref', 'description', 'duration'
            ]);

            // Handle video upload if provided
            if ($request->hasFile('video')) {
                // Delete old video file if exists
                if ($course->video_ref && !str_contains($course->video_ref, 'youtu')) {
                    Storage::disk('public')->delete('videos/' . $course->video_ref);
                }

                $videoPath = $request->file('video')->store('videos', 'public');
                $updateData['video_ref'] = basename($videoPath);

                // Dispatch transcoding job for new video
                Queue::push(new TranscodeVideoJob($course, basename($videoPath)));
            }

            // Handle PDF files
            if ($request->hasFile('pdf_summary')) {
                // Delete old PDF if exists
                if ($course->pdf_summary) {
                    Storage::disk('public')->delete('pdfs/' . $course->pdf_summary);
                }
                $pdfPath = $request->file('pdf_summary')->store('pdfs', 'public');
                $updateData['pdf_summary'] = basename($pdfPath);
            }

            if ($request->hasFile('exercises_pdf')) {
                // Delete old PDF if exists
                if ($course->exercises_pdf) {
                    Storage::disk('public')->delete('pdfs/' . $course->exercises_pdf);
                }
                $pdfPath = $request->file('exercises_pdf')->store('pdfs', 'public');
                $updateData['exercises_pdf'] = basename($pdfPath);
            }

            $course->update($updateData);

            \Log::info('Course updated successfully', [
                'course_id' => $course->id,
                'update_data' => $updateData
            ]);

            return response()->json([
                'message' => 'Course updated successfully',
                'data' => $course->fresh()->load('chapter')
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating course', [
                'course_id' => $course->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified course/video.
     */
    public function destroy(Course $course)
    {
        // Only admin can delete videos
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only admin can delete videos'
            ], 403);
        }

        // Delete video file if exists
        if ($course->video_ref) {
            Storage::disk('public')->delete('videos/' . $course->video_ref);
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

        // Transform the data to include year_target from chapter
        $coursesData = $courses->getCollection()->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'chapter_id' => $course->chapter_id,
                'year_target' => $course->chapter?->year_target,
                'video_ref' => $course->video_ref,
                'pdf_summary' => $course->pdf_summary,
                'exercises_pdf' => $course->exercises_pdf,
                'created_at' => $course->created_at,
                'updated_at' => $course->updated_at,
                'chapter' => $course->chapter,
            ];
        });

        return response()->json([
            'data' => $coursesData,
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
     * Business logic: All videos are Alouaoui's online content.
     */
    public function streamToken(Course $course)
    {
        $user = Auth::user();
        
        // Admin can access everything
        if ($user->role === 'admin') {
            $token = route('courses.stream', ['course' => $course->id]);
            return response()->json([
                'stream_url' => $token,
                'expires_at' => now()->addHour(),
            ]);
        }

        // For students, use AccessControlService to check video access
        if ($user->role === 'student') {
            $accessControlService = new \App\Services\AccessControlService();
            
            // All videos are online content (Alouaoui's), check hasVideoAccess
            if (!$accessControlService->hasVideoAccess($user, null)) {
                return response()->json([
                    'message' => 'Abonnement actif à Alouaoui requis pour accéder au contenu vidéo',
                    'error_code' => 'ALOUAOUI_SUBSCRIPTION_REQUIRED'
                ], 403);
            }

            $token = route('courses.stream', ['course' => $course->id]);
            return response()->json([
                'stream_url' => $token,
                'expires_at' => now()->addHour(),
            ]);
        }

        return response()->json([
            'message' => 'Unauthorized'
        ], 403);
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

    /**
     * Upload PDF file for a course
     */
    public function uploadPDF(Request $request, Course $course)
    {
        // Only admin can upload PDFs
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only admin can upload PDFs'
            ], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
            'type' => 'required|in:summary,exercises'
        ]);

        try {
            // Delete old PDF if exists
            if ($request->type === 'summary' && $course->pdf_summary) {
                Storage::disk('public')->delete('pdfs/' . $course->pdf_summary);
            } elseif ($request->type === 'exercises' && $course->exercises_pdf) {
                Storage::disk('public')->delete('pdfs/' . $course->exercises_pdf);
            }

            // Store new PDF
            $path = $request->file('file')->store('pdfs', 'public');
            $filename = basename($path);

            // Update course record
            if ($request->type === 'summary') {
                $course->pdf_summary = $filename;
            } else {
                $course->exercises_pdf = $filename;
            }
            $course->save();

            return response()->json([
                'message' => 'PDF uploaded successfully',
                'data' => [
                    'type' => $request->type,
                    'filename' => $filename
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete PDF file from a course
     */
    public function deletePDF(Request $request, Course $course)
    {
        // Only admin can delete PDFs
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Only admin can delete PDFs'
            ], 403);
        }

        $request->validate([
            'type' => 'required|in:summary,exercises'
        ]);

        try {
            if ($request->type === 'summary') {
                if ($course->pdf_summary) {
                    Storage::disk('public')->delete('pdfs/' . $course->pdf_summary);
                    $course->pdf_summary = null;
                }
            } else {
                if ($course->exercises_pdf) {
                    Storage::disk('public')->delete('pdfs/' . $course->exercises_pdf);
                    $course->exercises_pdf = null;
                }
            }
            
            $course->save();

            return response()->json([
                'message' => 'PDF deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
