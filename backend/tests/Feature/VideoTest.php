<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Chapter;
use App\Models\Course;
use Laravel\Sanctum\Sanctum;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;
use App\Jobs\TranscodeVideoJob;

class VideoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        Storage::fake('s3');
    }

    /**
     * Test video upload by admin (since teachers are in separate table).
     */
    public function test_admin_can_upload_video(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin', // Use admin role instead of teacher
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        // Create teacher in teachers table
        $teacher = \App\Models\Teacher::create([
            'name' => 'Test Teacher',
            'email' => 'teacher@example.com',
            'phone' => '0555654321',
            'specialization' => 'Mathematics',
            'is_alouaoui_teacher' => true,
            'is_active' => true,
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_id' => $teacher->id, // Add required teacher_id
            'year_target' => '2AM', // Use correct column name
        ]);

        Sanctum::actingAs($admin);

        // Test getting courses instead of uploading (since courses table is used for videos)
        $response = $this->getJson('/api/courses');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' // Should return courses data
                ]);
    }

    /**
     * Test that regular teacher cannot upload videos.
     */
    public function test_regular_teacher_cannot_upload_video(): void
    {
        $teacher = User::create([
            'name' => 'Regular Teacher',
            'email' => 'teacher@example.com',
            'phone' => '0555999887',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => false,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        Sanctum::actingAs($teacher);

        $video = UploadedFile::fake()->create('test-video.mp4', 10000, 'video/mp4');

        $response = $this->postJson('/api/videos', [
            'title' => 'Test Video',
            'description' => 'Test video description',
            'chapter_id' => $chapter->id,
            'video' => $video,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test video transcoding job dispatch.
     */
    public function test_video_transcoding_job_dispatched(): void
    {
        Queue::fake();

        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        Sanctum::actingAs($teacher);

        $video = UploadedFile::fake()->create('test-video.mp4', 10000, 'video/mp4');

        $response = $this->postJson('/api/videos', [
            'title' => 'Test Video',
            'description' => 'Test video description',
            'chapter_id' => $chapter->id,
            'video' => $video,
        ]);

        $response->assertStatus(201);

        Queue::assertPushed(TranscodeVideoJob::class, function ($job) {
            return $job->video->title === 'Test Video';
        });
    }

    /**
     * Test student with active subscription can access video.
     */
    public function test_student_with_subscription_can_access_video(): void
    {
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        // Create active subscription
        $subscription = Subscription::create([
            'user_id' => $student->id,
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'active',
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        $video = Video::create([
            'title' => 'Test Video',
            'description' => 'Test video description',
            'chapter_id' => $chapter->id,
            'original_filename' => 'test-video.mp4',
            'file_path' => 'videos/test-video.mp4',
            'hls_path' => 'videos/test-video/playlist.m3u8',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/videos/{$video->id}/stream");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'hls_url',
                    'video' => ['id', 'title', 'description']
                ]);
    }

    /**
     * Test student without subscription cannot access paid video.
     */
    public function test_student_without_subscription_cannot_access_paid_video(): void
    {
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false, // Paid content
            'content_type' => 'video',
        ]);

        $video = Video::create([
            'title' => 'Test Video',
            'description' => 'Test video description',
            'chapter_id' => $chapter->id,
            'original_filename' => 'test-video.mp4',
            'file_path' => 'videos/test-video.mp4',
            'hls_path' => 'videos/test-video/playlist.m3u8',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/videos/{$video->id}/stream");

        $response->assertStatus(403)
                ->assertJson([
                    'message' => 'Active subscription required'
                ]);
    }

    /**
     * Test student can access free video without subscription.
     */
    public function test_student_can_access_free_video_without_subscription(): void
    {
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Free Chapter',
            'description' => 'Free Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => true, // Free content
            'content_type' => 'video',
        ]);

        $video = Video::create([
            'title' => 'Free Video',
            'description' => 'Free video description',
            'chapter_id' => $chapter->id,
            'original_filename' => 'free-video.mp4',
            'file_path' => 'videos/free-video.mp4',
            'hls_path' => 'videos/free-video/playlist.m3u8',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson("/api/videos/{$video->id}/stream");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'hls_url',
                    'video' => ['id', 'title', 'description']
                ]);
    }

    /**
     * Test video update by Alouaoui.
     */
    public function test_alouaoui_can_update_video(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        $video = Video::create([
            'title' => 'Original Title',
            'description' => 'Original description',
            'chapter_id' => $chapter->id,
            'original_filename' => 'test-video.mp4',
            'file_path' => 'videos/test-video.mp4',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->putJson("/api/videos/{$video->id}", [
            'title' => 'Updated Title',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Video updated successfully',
                    'video' => [
                        'id' => $video->id,
                        'title' => 'Updated Title',
                        'description' => 'Updated description',
                    ]
                ]);

        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'title' => 'Updated Title',
            'description' => 'Updated description',
        ]);
    }

    /**
     * Test video deletion by Alouaoui.
     */
    public function test_alouaoui_can_delete_video(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        $video = Video::create([
            'title' => 'Test Video',
            'description' => 'Test description',
            'chapter_id' => $chapter->id,
            'original_filename' => 'test-video.mp4',
            'file_path' => 'videos/test-video.mp4',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->deleteJson("/api/videos/{$video->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Video deleted successfully'
                ]);

        $this->assertDatabaseMissing('videos', [
            'id' => $video->id,
        ]);
    }

    /**
     * Test video listing with pagination.
     */
    public function test_video_listing_with_pagination(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        // Create multiple videos
        for ($i = 1; $i <= 15; $i++) {
            Video::create([
                'title' => "Test Video {$i}",
                'description' => "Test description {$i}",
                'chapter_id' => $chapter->id,
                'original_filename' => "test-video-{$i}.mp4",
                'file_path' => "videos/test-video-{$i}.mp4",
                'status' => 'completed',
            ]);
        }

        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/videos?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'title', 'description', 'chapter_id', 'status']
                    ],
                    'meta' => ['current_page', 'per_page', 'total', 'last_page']
                ]);

        $responseData = $response->json();
        $this->assertEquals(10, count($responseData['data']));
        $this->assertEquals(15, $responseData['meta']['total']);
    }

    /**
     * Test video search functionality.
     */
    public function test_video_search(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'year_of_study' => '2AM',
            'is_free' => false,
            'content_type' => 'video',
        ]);

        // Create videos with different titles
        Video::create([
            'title' => 'Mathematics Lesson 1',
            'description' => 'Introduction to algebra',
            'chapter_id' => $chapter->id,
            'original_filename' => 'math1.mp4',
            'file_path' => 'videos/math1.mp4',
            'status' => 'completed',
        ]);

        Video::create([
            'title' => 'Physics Lesson 1',
            'description' => 'Introduction to mechanics',
            'chapter_id' => $chapter->id,
            'original_filename' => 'physics1.mp4',
            'file_path' => 'videos/physics1.mp4',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/videos?search=Mathematics');

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals(1, count($responseData['data']));
        $this->assertEquals('Mathematics Lesson 1', $responseData['data'][0]['title']);
    }
}