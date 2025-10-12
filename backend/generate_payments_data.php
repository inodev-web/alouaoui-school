<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Payment;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Session;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

echo "=== Génération de données de test pour le dashboard ===\n\n";

try {
    // 1. Créer des abonnements de test (avec les bonnes colonnes)
    echo "1. Création d'abonnements de test...\n";
    
    $students = User::where('role', 'student')->take(10)->get();
    $teachers = Teacher::take(3)->get();
    
    if ($teachers->isEmpty()) {
        echo "Aucun enseignant trouvé. Création d'enseignants de test...\n";
        // Créer quelques enseignants de test
        for ($i = 1; $i <= 3; $i++) {
            $teacher = Teacher::create([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'name' => 'Enseignant ' . $i,
                'subject' => collect(['Mathématiques', 'Physique', 'Arabe'])->random(),
                'email' => 'teacher' . $i . '@school.com',
                'phone' => '055512345' . $i,
                'bio' => 'Enseignant expérimenté',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "  - Enseignant créé: {$teacher->name}\n";
        }
        $teachers = Teacher::all();
    }
    
    foreach ($students as $student) {
        $teacher = $teachers->random();
        $subscription = Subscription::create([
            'user_uuid' => $student->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subDays(rand(1, 30)),
            'ends_at' => now()->addDays(rand(30, 365)),
        ]);
        echo "  - Abonnement créé pour {$student->phone} avec {$teacher->name}\n";
    }
    
    // 2. Créer des paiements de test
    echo "\n2. Création de paiements de test...\n";
    
    $subscriptions = Subscription::all();
    
    foreach ($subscriptions as $subscription) {
        // Créer 1-3 paiements par abonnement
        for ($i = 0; $i < rand(1, 3); $i++) {
            $payment = Payment::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'user_id' => $subscription->user->id ?? null,
                'teacher_id' => null, // Teacher table separée
                'amount' => rand(2000, 8000),
                'context' => 'subscription',
                'context_id' => $subscription->id,
                'status' => collect(['confirmed', 'pending', 'failed'])->random(),
                'payment_method' => collect(['school_cash', 'online'])->random(),
                'payment_date' => now()->subDays(rand(1, 60)),
                'created_at' => now()->subDays(rand(1, 60)),
                'updated_at' => now(),
            ]);
            echo "  - Paiement de {$payment->amount} DZD créé\n";
        }
    }
    
    // 3. Créer des paiements pour entrée école
    echo "\n3. Création de paiements d'entrée école...\n";
    
    $studentsForEntry = User::where('role', 'student')->take(15)->get();
    
    foreach ($studentsForEntry as $student) {
        $payment = Payment::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'user_id' => $student->id,
            'teacher_id' => null,
            'amount' => rand(500, 2000),
            'context' => 'school_entry',
            'context_id' => null,
            'status' => collect(['confirmed', 'pending'])->random(),
            'payment_method' => 'school_cash',
            'payment_date' => now()->subDays(rand(1, 30)),
            'created_at' => now()->subDays(rand(1, 30)),
            'updated_at' => now(),
        ]);
        echo "  - Paiement d'entrée de {$payment->amount} DZD créé pour {$student->phone}\n";
    }
    
    echo "\n✅ Données de test générées avec succès!\n";
    
    // Afficher un résumé
    echo "\n=== RÉSUMÉ ===\n";
    echo "Étudiants: " . User::where('role', 'student')->count() . "\n";
    echo "Enseignants: " . Teacher::count() . "\n";
    echo "Abonnements: " . Subscription::count() . "\n";
    echo "Paiements totaux: " . Payment::count() . "\n";
    echo "Paiements confirmés: " . Payment::where('status', 'confirmed')->count() . "\n";
    echo "Total des revenus confirmés: " . Payment::where('status', 'confirmed')->sum('amount') . " DZD\n";
    echo "Revenus ce mois: " . Payment::where('status', 'confirmed')
        ->whereMonth('payment_date', now()->month)
        ->sum('amount') . " DZD\n";
    
    // Répartition par contexte
    echo "\nRépartition des paiements:\n";
    foreach (['subscription', 'session', 'school_entry'] as $context) {
        $count = Payment::where('context', $context)->count();
        $amount = Payment::where('context', $context)->where('status', 'confirmed')->sum('amount');
        echo "  - {$context}: {$count} paiements, {$amount} DZD\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la génération ===\n";