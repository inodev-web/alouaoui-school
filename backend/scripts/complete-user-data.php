<?php

/**
 * Script pour compléter les données d'un utilisateur de test
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== Completion des données utilisateur ===\n";

try {
    $user = User::where('phone', '0123456789')->first();
    
    if ($user) {
        $user->update([
            'birth_date' => '2000-01-15',
            'address' => 'Rue de Test, Casablanca',
            'school_name' => 'Lycée Al Alouaoui',
            'year_of_study' => '2BAC'
        ]);
        
        echo "✅ Données mises à jour:\n";
        echo "  🎂 Date naissance: {$user->birth_date}\n";
        echo "  🏠 Adresse: {$user->address}\n";
        echo "  🏫 École: {$user->school_name}\n";
        echo "  📚 Année d'étude: {$user->year_of_study}\n";
        
    } else {
        echo "❌ Utilisateur non trouvé\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Fin ===\n";