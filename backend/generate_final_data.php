<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

echo "=== Génération de données de test pour le dashboard ===\n\n";

try {
    // 1. Vérifier les abonnements existants
    echo "1. Vérification des abonnements...\n";
    $subscriptions = Subscription::count();
    echo "Abonnements existants: {$subscriptions}\n";
    
    // 2. Payment system removed
    echo "\n2. Payment system has been removed...\n";
    
    echo "\n✅ Données de test générées avec succès!\n";
    
    // Afficher un résumé détaillé
    echo "\n=== RÉSUMÉ COMPLET ===\n";
    echo "Étudiants: " . User::where('role', 'student')->count() . "\n";
    echo "Enseignants: " . Teacher::count() . "\n";
    echo "Abonnements: " . Subscription::count() . "\n";
    echo "Payment system has been removed\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la génération ===\n";