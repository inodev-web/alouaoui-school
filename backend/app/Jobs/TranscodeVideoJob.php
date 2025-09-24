<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Course;
use Exception;

class TranscodeVideoJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 3600; // 1 hour

    /**
     * Course instance
     */
    protected Course $course;

    /**
     * Original video file path
     */
    protected string $originalVideoPath;

    /**
     * Create a new job instance.
     */
    public function __construct(Course $course, string $originalVideoPath)
    {
        $this->course = $course;
        $this->originalVideoPath = $originalVideoPath;
    }

    /**
     * Execute the job - Transcode video to HLS format and upload to S3
     */
    public function handle(): void
    {
        try {
            Log::info("Starting video transcoding for course: {$this->course->id}");

            // Step 1: Download original video from storage
            $localVideoPath = $this->downloadVideoLocally();

            // Step 2: Transcode to HLS format
            $hlsDirectory = $this->transcodeToHLS($localVideoPath);

            // Step 3: Upload HLS segments to S3
            $s3PlaylistUrl = $this->uploadHLSToS3($hlsDirectory);

            // Step 4: Update course with HLS URL
            $this->course->update([
                'video_ref' => $s3PlaylistUrl,
                'transcoding_status' => 'completed'
            ]);

            // Step 5: Cleanup local files
            $this->cleanupLocalFiles($localVideoPath, $hlsDirectory);

            Log::info("Video transcoding completed successfully for course: {$this->course->id}");

        } catch (Exception $e) {
            Log::error("Video transcoding failed for course {$this->course->id}: " . $e->getMessage());

            // Update course status to failed
            $this->course->update(['transcoding_status' => 'failed']);

            throw $e;
        }
    }

    /**
     * Download video from storage to local temporary directory
     */
    protected function downloadVideoLocally(): string
    {
        $tempDir = storage_path('app/temp/transcoding');

        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $fileName = 'course_' . $this->course->id . '_' . time() . '.mp4';
        $localPath = $tempDir . '/' . $fileName;

        // Download from S3 or local storage
        $videoContent = Storage::get($this->originalVideoPath);
        file_put_contents($localPath, $videoContent);

        return $localPath;
    }

    /**
     * Transcode video to HLS format using FFmpeg
     */
    protected function transcodeToHLS(string $inputPath): string
    {
        $outputDir = storage_path('app/temp/hls/course_' . $this->course->id);

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $playlistPath = $outputDir . '/playlist.m3u8';

        // FFmpeg command for HLS transcoding with multiple quality levels
        $command = sprintf(
            'ffmpeg -i "%s" ' .
            '-c:v libx264 -c:a aac ' .
            '-map 0:v -map 0:a ' .
            '-f hls ' .
            '-hls_time 10 ' .
            '-hls_playlist_type vod ' .
            '-hls_segment_filename "%s/segment_%%03d.ts" ' .
            '-master_pl_name "master.m3u8" ' .
            '"%s"',
            $inputPath,
            $outputDir,
            $playlistPath
        );

        // Execute FFmpeg command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception("FFmpeg transcoding failed with return code: $returnCode. Output: " . implode("\n", $output));
        }

        return $outputDir;
    }

    /**
     * Upload HLS segments and playlist to S3
     */
    protected function uploadHLSToS3(string $hlsDirectory): string
    {
        $s3Path = 'videos/hls/course_' . $this->course->id;

        // Upload all HLS files (segments and playlists)
        $files = glob($hlsDirectory . '/*');

        foreach ($files as $file) {
            $fileName = basename($file);
            $s3FilePath = $s3Path . '/' . $fileName;

            Storage::disk('s3')->put($s3FilePath, file_get_contents($file));
        }

        // Return the S3 path to the master playlist
        return $s3Path . '/master.m3u8';
    }

    /**
     * Clean up local temporary files
     */
    protected function cleanupLocalFiles(string $videoPath, string $hlsDirectory): void
    {
        // Remove original video file
        if (file_exists($videoPath)) {
            unlink($videoPath);
        }

        // Remove HLS directory and contents
        if (is_dir($hlsDirectory)) {
            $files = glob($hlsDirectory . '/*');
            foreach ($files as $file) {
                unlink($file);
            }
            rmdir($hlsDirectory);
        }
    }

    /**
     * Handle job failure
     */
    public function failed(Exception $exception): void
    {
        Log::error("TranscodeVideoJob failed permanently for course {$this->course->id}: " . $exception->getMessage());

        // Update course status to failed
        $this->course->update(['transcoding_status' => 'failed']);

        // Optionally, send notification to admin
        // Notification::route('mail', config('app.admin_email'))
        //     ->notify(new VideoTranscodingFailedNotification($this->course, $exception));
    }
}
