<?php

/**
 * Script de test pour diagnostiquer les problèmes de base de données
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test de la base de données ===\n";

try {
    // Test de connexion
    $connection = DB::connection();
    echo "✓ Connexion à la base de données réussie\n";
    
    // Vérifier les tables existantes
    $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
    echo "\n📋 Tables existantes:\n";
    foreach ($tables as $table) {
        echo "  - {$table->name}\n";
    }
    
    // Vérifier la structure de personal_access_tokens
    echo "\n🔍 Structure de personal_access_tokens:\n";
    try {
        $columns = DB::select("PRAGMA table_info(personal_access_tokens)");
        if (empty($columns)) {
            echo "  ❌ Table personal_access_tokens n'existe pas ou est vide\n";
        } else {
            foreach ($columns as $column) {
                echo "  - {$column->name} ({$column->type})\n";
            }
        }
    } catch (Exception $e) {
        echo "  ❌ Erreur lors de la lecture de la structure: " . $e->getMessage() . "\n";
    }
    
    // Test d'insertion simple
    echo "\n🧪 Test d'insertion dans personal_access_tokens:\n";
    try {
        DB::table('personal_access_tokens')->insert([
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id' => 1,
            'name' => 'test-token',
            'token' => hash('sha256', 'test-token-value'),
            'abilities' => json_encode(['*']),
            'expires_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "  ✓ Insertion réussie\n";
        
        // Compter les tokens
        $count = DB::table('personal_access_tokens')->count();
        echo "  📊 Nombre de tokens: $count\n";
        
        // Nettoyer le test
        DB::table('personal_access_tokens')->where('name', 'test-token')->delete();
        echo "  🧹 Token de test supprimé\n";
        
    } catch (Exception $e) {
        echo "  ❌ Erreur lors de l'insertion: " . $e->getMessage() . "\n";
    }
    
    // Vérifier les utilisateurs
    echo "\n👥 Test des utilisateurs:\n";
    $userCount = DB::table('users')->count();
    echo "  📊 Nombre d'utilisateurs: $userCount\n";
    
    if ($userCount > 0) {
        $firstUser = DB::table('users')->first();
        echo "  👤 Premier utilisateur: {$firstUser->phone} (role: {$firstUser->role})\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin du test ===\n";