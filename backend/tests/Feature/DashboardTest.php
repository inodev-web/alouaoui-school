<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Subscription;
use App\Models\Payment;
use App\Models\Attendance;
use App\Models\Session;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $admin;
    private User $student;
    private Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'device_uuid' => 'test-admin-device'
        ]);
        $this->student = User::factory()->create([
            'role' => 'student',
            'device_uuid' => 'test-student-device'
        ]);
        $this->teacher = Teacher::factory()->create();
    }

    public function test_admin_can_access_dashboard()
    {
        // Créer quelques données de test
        User::factory()->count(5)->create(['role' => 'student']);
        
        // Créer explicitly le chapitre et les cours
        $chapter = Chapter::create([
            'title' => 'Test Chapter',
            'description' => 'Test chapter for dashboard',
            'teacher_id' => $this->teacher->id,
            'year_target' => '1AM',
        ]);
        
        // Créer 3 cours liés à ce chapitre
        for ($i = 1; $i <= 3; $i++) {
            Course::create([
                'chapter_id' => $chapter->id,
                'title' => "Test Course $i",
                'year_target' => '1AM',
            ]);
        }
        
        $student1 = User::factory()->create(['role' => 'student']);
        $student2 = User::factory()->create(['role' => 'student']);
        
        Subscription::create([
            'user_id' => $student1->id,
            'teacher_id' => $this->teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => true,
            'school_entry_access' => false,
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(25),
            'status' => 'active',
        ]);
        
        Subscription::create([
            'user_id' => $student2->id,
            'teacher_id' => $this->teacher->id,
            'amount' => 1500,
            'videos_access' => true,
            'lives_access' => true,
            'school_entry_access' => false,
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(25),
            'status' => 'active',
        ]);

        $student3 = User::factory()->create(['role' => 'student']);
        Payment::create([
            'user_id' => $student3->id,
            'amount' => 1000,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-TEST1',
        ]);
        
        Payment::create([
            'user_id' => $student1->id,
            'amount' => 1000,
            'currency' => 'DZD',
            'payment_method' => 'online',
            'status' => 'completed',
            'reference' => 'PAY-TEST2',
        ]);
        
        Payment::create([
            'user_id' => $student2->id,
            'amount' => 1000,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-TEST3',
        ]);

        // Mettre à jour le device_uuid pour éviter les conflits
        $this->admin->update(['device_uuid' => 'test-admin-device']);
        $token = $this->admin->createToken('test-admin-device')->plainTextToken;
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Device-UUID' => 'test-admin-device'
        ])->getJson('/api/dashboard/admin');



        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'total_students',
                        'total_teachers',
                        'total_courses',
                        'total_chapters',
                        'active_subscriptions',
                        'pending_subscriptions',
                        'expired_subscriptions',
                        'total_revenue',
                        'monthly_revenue',
                        'pending_payments',
                        'pending_payments_amount',
                        'new_students_this_month',
                        'growth_metrics' => [
                            'student_growth_rate',
                            'revenue_growth_rate',
                            'current_month_students',
                            'current_month_revenue',
                        ],
                        'recent_activity' => [
                            'recent_registrations',
                            'recent_payments',
                            'recent_subscriptions',
                        ],
                        'top_teachers_by_revenue',
                    ]
                ]);

        // Vérifier quelques valeurs
        // 5 créés initialement + 1 student + 3 ajoutés = 9 total
        $this->assertEquals(9, $response->json('data.total_students'));
        $this->assertEquals(1, $response->json('data.total_teachers'));
        $this->assertEquals(3, $response->json('data.total_courses'));
        $this->assertEquals(2, $response->json('data.active_subscriptions'));
        $this->assertEquals(3000, $response->json('data.total_revenue')); // 3 * 1000
    }

    public function test_student_cannot_access_admin_dashboard()
    {
        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson('/api/dashboard/admin');

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ]);
    }

    public function test_student_can_access_student_dashboard()
    {
        // Créer un abonnement actif pour l'étudiant
        $subscription = Subscription::factory()->create([
            'user_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'active',
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(25),
        ]);

        // Créer quelques cours pour ce prof
        $chapter = Chapter::create([
            'title' => 'Test Student Chapter',
            'description' => 'Test chapter for student dashboard',
            'teacher_id' => $this->teacher->id,
            'year_target' => '1AM',
        ]);
        
        // Créer 5 cours liés à ce chapitre
        for ($i = 1; $i <= 5; $i++) {
            Course::create([
                'chapter_id' => $chapter->id,
                'title' => "Test Student Course $i",
                'year_target' => '1AM',
            ]);
        }

        // Créer quelques paiements pour l'étudiant
        Payment::factory()->count(2)->create([
            'user_id' => $this->student->id,
            'status' => 'completed',
            'amount' => 500,
        ]);

        // Créer une session et présence
        $session = Session::factory()->create(['teacher_id' => $this->teacher->id]);
        Attendance::factory()->create([
            'user_id' => $this->student->id,
            'session_id' => $session->id,
        ]);

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson('/api/dashboard/student');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'profile' => [
                            'name',
                            'email',
                            'year_of_study',
                            'phone',
                        ],
                        'subscription' => [
                            'is_active',
                            'teacher_name',
                            'expires_at',
                            'days_remaining',
                            'access_types' => [
                                'videos',
                                'lives',
                                'school_entry',
                            ]
                        ],
                        'learning_progress' => [
                            'total_courses_available',
                            'accessible_courses',
                            'free_courses_available',
                            'completion_rate',
                        ],
                        'recent_payments',
                        'recent_attendances',
                        'statistics' => [
                            'total_payments',
                            'total_spent',
                            'total_attendances',
                        ]
                    ]
                ]);

        // Vérifier les valeurs de l'abonnement
        $this->assertTrue($response->json('data.subscription.is_active'));
        $this->assertEquals($this->teacher->name, $response->json('data.subscription.teacher_name'));
        $this->assertEquals(5, $response->json('data.learning_progress.accessible_courses'));
        $this->assertEquals(1000, $response->json('data.statistics.total_spent')); // 2 * 500
    }

    public function test_student_dashboard_without_subscription()
    {
        // Créer quelques cours gratuits
        $chapter = Chapter::create([
            'title' => 'Test Free Chapter',
            'description' => 'Test chapter for free courses',
            'teacher_id' => $this->teacher->id,
            'year_target' => '1AM',
        ]);
        
        // Créer 3 cours gratuits
        for ($i = 1; $i <= 3; $i++) {
            Course::create([
                'chapter_id' => $chapter->id,
                'title' => "Test Free Course $i",
                'year_target' => '1AM',
            ]);
        }

        $response = $this->actingAs($this->student)
                         ->withHeaders(['X-Device-UUID' => 'test-student-device'])
                         ->getJson('/api/dashboard/student');

        $response->assertStatus(200);

        // Vérifier qu'il n'y a pas d'abonnement actif
        $this->assertFalse($response->json('data.subscription.is_active'));
        $this->assertEquals('Aucun abonnement actif', $response->json('data.subscription.message'));

        // Vérifier l'accès limité sans abonnement
        $this->assertEquals(0, $response->json('data.learning_progress.accessible_courses'));
    }

    public function test_admin_cannot_access_student_dashboard()
    {
        $response = $this->actingAs($this->admin)
                         ->withHeaders(['X-Device-UUID' => 'test-admin-device'])
                         ->getJson('/api/dashboard/student');

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Accès réservé aux étudiants'
                ]);
    }

    public function test_public_stats_accessible_without_auth()
    {
        // Créer quelques données
        User::factory()->count(10)->create(['role' => 'student']);
        Teacher::factory()->count(3)->create();
        
        // Créer explicitement le chapitre et les cours
        $chapter = Chapter::create([
            'title' => 'Test Public Chapter',
            'description' => 'Test chapter for public stats',
            'teacher_id' => $this->teacher->id,
            'year_target' => '1AM',
        ]);
        
        // Créer 7 cours liés à ce chapitre
        for ($i = 1; $i <= 7; $i++) {
            Course::create([
                'chapter_id' => $chapter->id,
                'title' => "Test Public Course $i",
                'year_target' => '1AM',
            ]);
        }

        $response = $this->getJson('/api/dashboard/public-stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'total_students',
                        'total_courses',
                        'active_teachers',
                        'success_stories',
                    ]
                ]);

        // Vérifier les valeurs (11 = 10 créés + 1 de setUp)
        $this->assertEquals(11, $response->json('data.total_students'));
        $this->assertEquals(7, $response->json('data.total_courses'));
        $this->assertEquals(4, $response->json('data.active_teachers')); // 3 créés + 1 de setUp
        $this->assertEquals(150, $response->json('data.success_stories')); // Valeur statique
    }

    public function test_dashboard_growth_metrics_calculation()
    {
        // Clear ALL existing data to ensure clean test - we'll create a new admin
        User::where('role', 'student')->delete();
        Payment::truncate();
        
        // Create a dedicated admin for this test to avoid conflicts
        $testAdmin = User::factory()->create([
            'role' => 'admin',
            'device_uuid' => 'test-growth-admin'
        ]);
        
        // Use dates that match exactly what getGrowthMetrics expects
        $currentMonth = now();
        $lastMonth = now()->subMonth();
        
        $lastMonthDate = $lastMonth->copy()->startOfMonth()->addDays(15); // Middle of last month
        $thisMonthDate = $currentMonth->copy()->startOfMonth()->addDays(15); // Middle of this month
        

        
        // Créer des étudiants du mois dernier
        $lastMonthStudents = User::factory()->count(5)->create([
            'role' => 'student',
            'created_at' => $lastMonthDate,
        ]);

        // Créer des étudiants de ce mois (exactement 8)
        $thisMonthStudents = User::factory()->count(8)->create([
            'role' => 'student',
            'created_at' => $thisMonthDate,
        ]);

        // Créer des paiements du mois dernier - use DB::table to bypass timestamp handling
        \DB::table('payments')->insert([
            'user_id' => $lastMonthStudents->first()->id,
            'amount' => 1000,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-LAST-1',
            'created_at' => $lastMonthDate,
            'updated_at' => $lastMonthDate,
        ]);
        
        \DB::table('payments')->insert([
            'user_id' => $lastMonthStudents->skip(1)->first()->id,
            'amount' => 1000,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-LAST-2',
            'created_at' => $lastMonthDate,
            'updated_at' => $lastMonthDate,
        ]);

        // Créer des paiements de ce mois - use DB::table to bypass timestamp handling
        \DB::table('payments')->insert([
            'user_id' => $thisMonthStudents->first()->id,
            'amount' => 1500,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-THIS-1',
            'created_at' => $thisMonthDate,
            'updated_at' => $thisMonthDate,
        ]);
        
        \DB::table('payments')->insert([
            'user_id' => $thisMonthStudents->skip(1)->first()->id,
            'amount' => 1500,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-THIS-2',
            'created_at' => $thisMonthDate,
            'updated_at' => $thisMonthDate,
        ]);
        
        \DB::table('payments')->insert([
            'user_id' => $thisMonthStudents->skip(2)->first()->id,
            'amount' => 1500,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'PAY-THIS-3',
            'created_at' => $thisMonthDate,
            'updated_at' => $thisMonthDate,
        ]);

        $response = $this->actingAs($testAdmin)
                         ->withHeaders(['X-Device-UUID' => 'test-growth-admin'])
                         ->getJson('/api/dashboard/admin');

        $response->assertStatus(200);

        $growthMetrics = $response->json('data.growth_metrics');



        // Calcul de croissance: (8 - 5) / 5 * 100 = 60%
        $this->assertEquals(60, $growthMetrics['student_growth_rate']);

        // Revenus: ce mois 4500 (3*1500), mois dernier 2000 (2*1000)
        // Croissance: (4500 - 2000) / 2000 * 100 = 125%
        $this->assertEquals(125, $growthMetrics['revenue_growth_rate']);
        $this->assertEquals(8, $growthMetrics['current_month_students']);
        $this->assertEquals(4500, $growthMetrics['current_month_revenue']);
    }
}
