<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Diagnostic de la table users ===\n\n";

try {
    // Vérifier la structure de la table
    echo "Structure de la table users:\n";
    $columns = Schema::getColumnListing('users');
    foreach ($columns as $column) {
        echo "- {$column}\n";
    }
    
    echo "\n=== Données de l'admin actuel ===\n";
    
    // Récupérer les données brutes
    $admin = DB::table('users')->where('phone', '0555123456')->first();
    
    if ($admin) {
        echo "ID: {$admin->id}\n";
        foreach ($admin as $key => $value) {
            echo "{$key}: " . ($value ?? 'NULL') . "\n";
        }
        
        echo "\n=== Mise à jour directe via SQL ===\n";
        
        // Mise à jour directe
        $updated = DB::table('users')
            ->where('phone', '0555123456')
            ->update([
                'name' => 'Administrator',
                'email' => 'admin@alouaoui-school.com',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => bcrypt('123456789'),
                'updated_at' => now()
            ]);
            
        echo "Lignes mises à jour: {$updated}\n";
        
        // Vérifier la mise à jour
        echo "\n=== Vérification après mise à jour ===\n";
        $adminUpdated = DB::table('users')->where('phone', '0555123456')->first();
        echo "Nom: " . ($adminUpdated->name ?? 'NULL') . "\n";
        echo "Email: " . ($adminUpdated->email ?? 'NULL') . "\n";
        echo "Statut: " . ($adminUpdated->status ?? 'NULL') . "\n";
        echo "Rôle: " . ($adminUpdated->role ?? 'NULL') . "\n";
        
    } else {
        echo "❌ Admin non trouvé\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin du diagnostic ===\n";