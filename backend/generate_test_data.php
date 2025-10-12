<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Subscription;
use App\Models\Session;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

echo "=== Génération de données de test pour le dashboard ===\n\n";

try {
    // 1. Créer des abonnements de test
    echo "1. Création d'abonnements de test...\n";
    
    $students = User::where('role', 'student')->take(10)->get();
    
    foreach ($students as $student) {
        $subscription = Subscription::updateOrCreate(
            ['user_id' => $student->id],
            [
                'teacher_id' => User::where('role', 'teacher')->inRandomOrder()->first()->id ?? null,
                'type' => collect(['monthly', 'quarterly', 'annual'])->random(),
                'amount' => rand(2000, 8000),
                'status' => collect(['active', 'pending', 'expired'])->random(),
                'start_date' => now()->subDays(rand(1, 90)),
                'end_date' => now()->addDays(rand(30, 365)),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]
        );
        echo "  - Abonnement créé pour {$student->phone}\n";
    }
    
    // 2. Payment system removed
    echo "\n2. Payment system has been removed...\n";
    
    // 3. Créer des cours de test
    echo "\n3. Création de cours de test...\n";
    
    $teachers = User::where('role', 'teacher')->get();
    $subjects = ['Mathématiques', 'Physique', 'Chimie', 'Sciences', 'Arabe', 'Français', 'Anglais'];
    
    foreach ($teachers as $teacher) {
        for ($i = 0; $i < rand(2, 5); $i++) {
            $course = Course::updateOrCreate(
                [
                    'teacher_id' => $teacher->id,
                    'title' => collect($subjects)->random() . ' - Niveau ' . collect(['1AM', '2AM', '3AM', '1AS', '2AS', '3AS'])->random()
                ],
                [
                    'description' => 'Cours de ' . collect($subjects)->random(),
                    'level' => collect(['1AM', '2AM', '3AM', '1AS', '2AS', '3AS'])->random(),
                    'price' => rand(1500, 5000),
                    'duration' => rand(60, 120),
                    'status' => 'active',
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]
            );
            echo "  - Cours '{$course->title}' créé\n";
        }
    }
    
    // 4. Créer des sessions de test
    echo "\n4. Création de sessions de test...\n";
    
    $courses = Course::all();
    
    foreach ($courses as $course) {
        for ($i = 0; $i < rand(5, 15); $i++) {
            $session = Session::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'teacher_id' => $course->teacher_id,
                'course_id' => $course->id,
                'title' => 'Session ' . ($i + 1) . ' - ' . $course->title,
                'description' => 'Description de la session',
                'scheduled_at' => now()->subDays(rand(1, 30))->addHours(rand(8, 18)),
                'duration' => rand(60, 120),
                'max_participants' => rand(20, 50),
                'price' => rand(500, 2000),
                'status' => collect(['scheduled', 'completed', 'cancelled'])->random(),
                'meeting_url' => 'https://meet.example.com/' . \Illuminate\Support\Str::random(10),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
            echo "  - Session '{$session->title}' créée\n";
        }
    }
    
    // 5. Créer des paiements pour les sessions
    echo "\n5. Création de paiements pour les sessions...\n";
    
    $sessions = Session::where('status', 'completed')->take(20)->get();
    
    // Payment system removed - no payment creation for sessions
    
    echo "\n✅ Données de test générées avec succès!\n";
    
    // Afficher un résumé
    echo "\n=== RÉSUMÉ ===\n";
    echo "Abonnements: " . Subscription::count() . "\n";
    echo "Cours: " . Course::count() . "\n";
    echo "Sessions: " . Session::count() . "\n";
    echo "Payment system has been removed\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la génération ===\n";