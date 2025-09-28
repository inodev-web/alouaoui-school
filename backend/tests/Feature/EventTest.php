<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Testing\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $alouaoui;
    private User $admin;
    private User $student;
    private Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer utilisateur Alouaoui
        $this->alouaoui = User::factory()->create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'role' => 'admin',
            'device_uuid' => 'test-alouaoui-device'
        ]);

        // Créer admin normal
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'device_uuid' => 'test-admin-device'
        ]);

        // Créer étudiant
        $this->student = User::factory()->create([
            'role' => 'student',
            'device_uuid' => 'test-student-device'
        ]);

        // Créer enseignant
        $this->teacher = Teacher::factory()->create();

        Storage::fake('public');
    }

    public function test_can_get_events_slider()
    {
        // Créer quelques events actifs
        $activeEvent = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'is_active' => true,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(7),
        ]);

        $inactiveEvent = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson('/api/events/slider');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'description',
                            'event_type',
                            'redirect_url',
                            'requires_subscription',
                            'teacher_name',
                            'can_access',
                        ]
                    ]
                ])
                ->assertJsonCount(1, 'data'); // Seul l'event actif

        $this->assertEquals($activeEvent->id, $response->json('data.0.id'));
    }

    public function test_alouaoui_can_create_event()
    {
        $eventData = [
            'title' => 'Nouveau cours de physique',
            'description' => 'Description du cours',
            'slider_image' => File::fake()->create('slider.jpg', 100),
            'alt_text' => 'Image du cours',
            'event_type' => 'course',
            'teacher_id' => $this->teacher->id,
            'target_id' => 1,
            'requires_subscription' => true,
            'start_date' => now()->addDay()->toDateTimeString(),
            'end_date' => now()->addDays(7)->toDateTimeString(),
            'order_index' => 1,
        ];

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->postJson('/api/events', $eventData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'id',
                        'title',
                        'description',
                        'event_type',
                        'teacher_id',
                    ],
                    'message'
                ]);

        $this->assertDatabaseHas('events', [
            'title' => 'Nouveau cours de physique',
            'event_type' => 'course',
            'teacher_id' => $this->teacher->id,
        ]);

        // Vérifier que l'image a été stockée
        $this->assertTrue(Storage::disk('public')->exists($response->json('data.slider_image')));
    }

    public function test_regular_admin_cannot_create_event()
    {
        $eventData = [
            'title' => 'Test Event',
            'description' => 'Test Description',
            'slider_image' => File::fake()->create('slider.jpg', 100),
            'event_type' => 'course',
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->addDay()->toDateTimeString(),
        ];

        $response = $this->actingAs($this->admin)
                         ->withHeaders(['X-Device-UUID' => 'test-admin-device'])
                         ->postJson('/api/events', $eventData);

        $response->assertStatus(403);
    }

    public function test_student_cannot_create_event()
    {
        $eventData = [
            'title' => 'Test Event',
            'description' => 'Test Description',
            'event_type' => 'course',
            'teacher_id' => $this->teacher->id,
            'start_date' => now()->addDay()->toDateTimeString(),
        ];

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->postJson('/api/events', $eventData);

        $response->assertStatus(403);
    }

    public function test_can_check_event_access_with_subscription()
    {
        // Créer un event qui nécessite un abonnement
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'requires_subscription' => true,
        ]);

        // Créer un abonnement actif pour l'étudiant
        Subscription::factory()->create([
            'user_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(30),
        ]);

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson("/api/events/{$event->id}/check-access");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'can_access' => true,
                ]);
    }

    public function test_cannot_access_event_without_subscription()
    {
        // Créer un event qui nécessite un abonnement
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'requires_subscription' => true,
        ]);

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson("/api/events/{$event->id}/check-access");

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'can_access' => false,
                ]);
    }

    public function test_can_access_free_event_without_subscription()
    {
        // Créer un event gratuit
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'requires_subscription' => false,
        ]);

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson("/api/events/{$event->id}/check-access");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'can_access' => true,
                ]);
    }

    public function test_alouaoui_can_update_event()
    {
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
        ]);

        $updateData = [
            'title' => 'Titre mis à jour',
            'description' => 'Description mise à jour',
        ];

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->putJson("/api/events/{$event->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'title' => 'Titre mis à jour',
                        'description' => 'Description mise à jour',
                    ],
                ]);

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Titre mis à jour',
        ]);
    }

    public function test_alouaoui_can_delete_event()
    {
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
        ]);

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->deleteJson("/api/events/{$event->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Événement supprimé avec succès',
                ]);

        $this->assertDatabaseMissing('events', [
            'id' => $event->id,
        ]);
    }

    public function test_can_toggle_event_status()
    {
        $event = Event::factory()->create([
            'teacher_id' => $this->teacher->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->patchJson("/api/events/{$event->id}/toggle-status");

        $response->assertStatus(200);

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_list_events()
    {
        Event::factory()->count(3)->create([
            'teacher_id' => $this->teacher->id,
        ]);

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->getJson('/api/events');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'title',
                                'description',
                                'event_type',
                                'teacher',
                            ]
                        ]
                    ]
                ]);
    }

    public function test_can_reorder_events()
    {
        $event1 = Event::factory()->create(['teacher_id' => $this->teacher->id, 'order_index' => 1]);
        $event2 = Event::factory()->create(['teacher_id' => $this->teacher->id, 'order_index' => 2]);

        $reorderData = [
            'events' => [
                ['id' => $event1->id, 'order_index' => 2],
                ['id' => $event2->id, 'order_index' => 1],
            ]
        ];

        $response = $this->actingAs($this->alouaoui)
                         ->withHeaders(['X-Device-UUID' => 'test-alouaoui-device'])
                         ->postJson('/api/events/reorder', $reorderData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('events', [
            'id' => $event1->id,
            'order_index' => 2,
        ]);

        $this->assertDatabaseHas('events', [
            'id' => $event2->id,
            'order_index' => 1,
        ]);
    }
}
