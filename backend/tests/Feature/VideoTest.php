<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
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
     * Helper method to create a teacher entity
     * Créer un vrai Teacher pour les subscriptions et relations
     */
    protected function createTeacher(array $attributes = []): Teacher
    {
        return Teacher::create(array_merge([
            'firstname' => 'Alouaoui',
            'lastname' => 'Teacher',
            'phone' => '0555' . random_int(100000, 999999),
            'specialization' => 'Mathematics',
            'is_alouaoui_teacher' => true,
            'is_active' => true,
        ], $attributes));
    }

    /**
     * Helper method to create a user entity
     */
    protected function createUser(array $attributes = []): User
    {
        $defaults = [
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555' . random_int(100000, 999999),
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ];

        return User::create(array_merge($defaults, $attributes));
    }

    /**
     * Helper method to authenticate a user with proper login flow
     */
    protected function authenticateUser(User $user): array
    {
        $deviceUuid = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->postJson('/api/auth/login', [
            'login' => $user->phone,
            'password' => 'password123',
            'device_uuid' => $deviceUuid
        ]);

        $token = $response->json('data.token');

        return [
            'Authorization' => 'Bearer ' . $token,
            'X-Device-UUID' => $deviceUuid,
        ];
    }

    /**
     * Test admin can access courses (videos) endpoint.
     */
    public function test_admin_can_access_courses(): void
    {
        $admin = $this->createUser([
            'role' => 'admin',
        ]);

        $teacher = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacher->uuid,
            'year_target' => '2AM',
        ]);

        // Create a test course (video)
        Course::create([
            'chapter_id' => $chapter->id,
            'title' => 'Test Video Course',
            'video_ref' => 'test-video.mp4',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($admin);

        $response = $this->getJson('/api/courses', $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'title', 'chapter_id', 'year_target']
                    ]
                ]);
    }

    /**
     * Test video transcoding job dispatch.
     */
    public function test_video_transcoding_job_dispatched(): void
    {
        Queue::fake();

        $teacher = $this->createUser([
            'role' => 'admin',
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_name' => 'Alouaoui',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($teacher);

        $video = UploadedFile::fake()->create('test-video.mp4', 10000, 'video/mp4');

        $response = $this->postJson('/api/videos', [
            'title' => 'Test Video',
            'year_target' => '2AM',
            'chapter_id' => $chapter->id,
            'video' => $video,
        ], $headers);

        $response->assertStatus(201);

        Queue::assertPushed(TranscodeVideoJob::class);
    }

    /**
     * Test student with active subscription can access video.
     */
    public function test_student_with_subscription_can_access_video(): void
    {
        $student = $this->createUser([
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        $teacher = $this->createTeacher();

        // Create active subscription with correct fields
        $subscription = Subscription::create([
            'user_uuid' => $student->uuid,
            'teacher_uuid' => $teacher->uuid,
            'amount' => 2000,
            'videos_access' => true,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addMonth()->toDateString(),
            'status' => 'active',
        ]);

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacher->uuid,
            'year_target' => '2AM',
        ]);

        $video = Course::create([
            'title' => 'Test Video',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/test-video.mp4',
            'video_ref' => 'videos/test-video/playlist.m3u8',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($student);

        $response = $this->getJson("/api/videos/{$video->id}", $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => ['id', 'title', 'chapter_id']
                ]);
    }

    /**
     * Test student without subscription cannot access paid video.
     */
    public function test_student_without_subscription_cannot_access_paid_video(): void
    {
        $student = $this->createUser([
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        $teacher = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacher->uuid,
            'year_target' => '2AM',
            'is_free' => false, // Paid content
        ]);

        $video = Course::create([
            'title' => 'Test Video',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/test-video.mp4',
            'video_ref' => 'videos/test-video/playlist.m3u8',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($student);

        $response = $this->postJson("/api/courses/{$video->id}/stream-token", [], $headers);

        $response->assertStatus(403);
    }

    /**
     * Test student can access free video without subscription.
     */
    public function test_student_can_access_free_video_without_subscription(): void
    {
        $student = $this->createUser([
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        $teacher = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Free Chapter',
            'description' => 'Free Chapter Description',
            'teacher_uuid' => $teacher->uuid,
            'year_target' => '2AM',
            'is_free' => true, // Free content
        ]);

        $video = Course::create([
            'title' => 'Free Video',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/free-video.mp4',
            'video_ref' => 'videos/free-video/playlist.m3u8',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($student);

        $response = $this->getJson("/api/videos/{$video->id}", $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => ['id', 'title', 'chapter_id']
                ]);
    }

    /**
     * Test video update by Alouaoui.
     */
    public function test_alouaoui_can_update_video(): void
    {
        $teacher = $this->createUser([
            'role' => 'admin',
        ]);

        $teacherEntity = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacherEntity->uuid,
            'year_target' => '2AM',
        ]);

        $video = Course::create([
            'title' => 'Original Title',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/test-video.mp4',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($teacher);

        $response = $this->putJson("/api/videos/{$video->id}", [
            'title' => 'Updated Title',
            'year_target' => '3AM',
        ], $headers);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Video updated successfully',
                    'data' => [
                        'id' => $video->id,
                        'title' => 'Updated Title',
                    ]
                ]);

        $this->assertDatabaseHas('courses', [
            'id' => $video->id,
            'title' => 'Updated Title',
            'year_target' => '3AM',
        ]);
    }

    /**
     * Test video deletion by Alouaoui.
     */
    public function test_alouaoui_can_delete_video(): void
    {
        $teacher = $this->createUser([
            'role' => 'admin',
        ]);

        $teacherEntity = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacherEntity->uuid,
            'year_target' => '2AM',
        ]);

        $video = Course::create([
            'title' => 'Test Video',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/test-video.mp4',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($teacher);

        $response = $this->deleteJson("/api/videos/{$video->id}", [], $headers);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Video deleted successfully'
                ]);

        $this->assertDatabaseMissing('courses', [
            'id' => $video->id,
        ]);
    }

    /**
     * Test video listing with pagination.
     */
    public function test_video_listing_with_pagination(): void
    {
        $teacher = $this->createUser([
            'role' => 'admin',
        ]);

        $teacherEntity = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacherEntity->uuid,
            'year_target' => '2AM',
        ]);

        // Create multiple videos
        for ($i = 1; $i <= 15; $i++) {
            Course::create([
                'title' => "Test Video {$i}",
                'chapter_id' => $chapter->id,
                'video_path' => "videos/test-video-{$i}.mp4",
                'year_target' => '2AM',
            ]);
        }

        $headers = $this->authenticateUser($teacher);

        $response = $this->getJson('/api/videos?per_page=10', $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'title', 'chapter_id', 'year_target']
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
        $teacher = $this->createUser([
            'role' => 'admin',
        ]);

        $teacherEntity = $this->createTeacher();

        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test Chapter Description',
            'teacher_uuid' => $teacherEntity->uuid,
            'year_target' => '2AM',
        ]);

        // Create videos with different titles
        Course::create([
            'title' => 'Mathematics Lesson 1',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/math1.mp4',
            'year_target' => '2AM',
        ]);

        Course::create([
            'title' => 'Physics Lesson 1',
            'chapter_id' => $chapter->id,
            'video_path' => 'videos/physics1.mp4',
            'year_target' => '2AM',
        ]);

        $headers = $this->authenticateUser($teacher);

        $response = $this->getJson('/api/videos/search?q=Mathematics', $headers);

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals(1, count($responseData['data']));
        $this->assertEquals('Mathematics Lesson 1', $responseData['data'][0]['title']);
    }
}
