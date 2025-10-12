<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Payment;
use App\Models\Teacher;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

echo "=== Génération de données de test pour le dashboard ===\n\n";

try {
    // 1. Vérifier les abonnements existants
    echo "1. Vérification des abonnements...\n";
    $subscriptions = Subscription::count();
    echo "Abonnements existants: {$subscriptions}\n";
    
    // 2. Créer des paiements de test avec les bonnes colonnes
    echo "\n2. Création de paiements de test...\n";
    
    $students = User::where('role', 'student')->take(15)->get();
    $teachers = Teacher::all();
    
    foreach ($students as $student) {
        // Créer 1-3 paiements par étudiant
        for ($i = 0; $i < rand(1, 3); $i++) {
            $teacher = $teachers->random();
            $payment = Payment::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'student_uuid' => $student->uuid,
                'teacher_uuid' => $teacher->uuid,
                'amount' => rand(2000, 8000),
                'method' => collect(['cash', 'online'])->random(),
                'status' => collect(['confirmed', 'pending', 'failed'])->random(),
                'payment_context' => collect(['subscription', 'session', 'school_entry'])->random(),
                'grants_school_entry' => rand(0, 1),
                'processor_reference' => 'REF-' . \Illuminate\Support\Str::random(8),
                'created_at' => now()->subDays(rand(1, 60)),
                'updated_at' => now(),
            ]);
            echo "  - Paiement de {$payment->amount} DZD créé pour {$student->phone}\n";
        }
    }
    
    echo "\n✅ Données de test générées avec succès!\n";
    
    // Afficher un résumé détaillé
    echo "\n=== RÉSUMÉ COMPLET ===\n";
    echo "Étudiants: " . User::where('role', 'student')->count() . "\n";
    echo "Enseignants: " . Teacher::count() . "\n";
    echo "Abonnements: " . Subscription::count() . "\n";
    echo "Paiements totaux: " . Payment::count() . "\n";
    
    // Statistiques par statut
    echo "\nPaiements par statut:\n";
    foreach (['confirmed', 'pending', 'failed'] as $status) {
        $count = Payment::where('status', $status)->count();
        $amount = Payment::where('status', $status)->sum('amount');
        echo "  - {$status}: {$count} paiements, {$amount} DZD\n";
    }
    
    // Statistiques par contexte
    echo "\nPaiements par contexte:\n";
    foreach (['subscription', 'session', 'school_entry'] as $context) {
        $count = Payment::where('payment_context', $context)->count();
        $amount = Payment::where('payment_context', $context)
                         ->where('status', 'confirmed')->sum('amount');
        echo "  - {$context}: {$count} paiements, {$amount} DZD confirmés\n";
    }
    
    // Statistiques par méthode
    echo "\nPaiements par méthode:\n";
    foreach (['cash', 'online'] as $method) {
        $count = Payment::where('method', $method)->count();
        $amount = Payment::where('method', $method)
                         ->where('status', 'confirmed')->sum('amount');
        echo "  - {$method}: {$count} paiements, {$amount} DZD confirmés\n";
    }
    
    // Revenus mensuels
    echo "\nRevenus ce mois: " . Payment::where('status', 'confirmed')
        ->whereMonth('created_at', now()->month)
        ->sum('amount') . " DZD\n";
        
    echo "Revenus total confirmés: " . Payment::where('status', 'confirmed')->sum('amount') . " DZD\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la génération ===\n";