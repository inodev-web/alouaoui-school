<?php

/**
 * Script pour recréer complètement la table personal_access_tokens
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Réparation de la table personal_access_tokens ===\n";

try {
    // Vérifier si la table existe
    echo "🔍 Vérification de l'état actuel...\n";
    $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name='personal_access_tokens'");
    
    if (!empty($tables)) {
        echo "  📋 Table personal_access_tokens existe\n";
        
        // Tenter de la supprimer
        echo "🗑️  Suppression de la table corrompue...\n";
        DB::statement('DROP TABLE IF EXISTS personal_access_tokens');
        echo "  ✓ Table supprimée\n";
    } else {
        echo "  ℹ️  Table personal_access_tokens n'existe pas\n";
    }
    
    // Recréer la table avec la structure correcte
    echo "🔨 Création de la nouvelle table...\n";
    DB::statement("
        CREATE TABLE personal_access_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tokenable_type VARCHAR(255) NOT NULL,
            tokenable_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            token VARCHAR(64) NOT NULL UNIQUE,
            abilities TEXT,
            last_used_at TIMESTAMP NULL,
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP NULL,
            updated_at TIMESTAMP NULL
        )
    ");
    echo "  ✓ Table créée\n";
    
    // Créer l'index
    echo "📊 Création des index...\n";
    DB::statement('CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens (tokenable_type, tokenable_id)');
    echo "  ✓ Index créé\n";
    
    // Test d'insertion
    echo "🧪 Test d'insertion...\n";
    DB::table('personal_access_tokens')->insert([
        'tokenable_type' => 'App\\Models\\User',
        'tokenable_id' => 1,
        'name' => 'test-repair',
        'token' => hash('sha256', 'test-repair-token'),
        'abilities' => json_encode(['*']),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "  ✓ Insertion réussie\n";
    
    // Vérifier
    $count = DB::table('personal_access_tokens')->count();
    echo "  📊 Nombre de tokens: $count\n";
    
    // Nettoyer le test
    DB::table('personal_access_tokens')->where('name', 'test-repair')->delete();
    echo "  🧹 Token de test supprimé\n";
    
    echo "\n✅ Réparation terminée avec succès!\n";
    
} catch (Exception $e) {
    echo "❌ Erreur lors de la réparation: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la réparation ===\n";