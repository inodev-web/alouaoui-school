#!/usr/bin/env php
<?php

/**
 * Script principal de diagnostic et réparation
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 DIAGNOSTIC ET RÉPARATION SYSTÈME D'AUTHENTIFICATION\n";
echo "====================================================\n\n";

$steps = [
    '1. Test de la base de données' => 'test-database.php',
    '2. Réparation de la table tokens' => 'repair-tokens-table.php',
    '3. Test d\'authentification Sanctum' => 'test-auth.php',
    '4. Test de l\'API' => 'test-api.php',
];

foreach ($steps as $stepName => $scriptFile) {
    echo "📋 $stepName\n";
    echo str_repeat('-', 50) . "\n";
    
    $scriptPath = __DIR__ . '/' . $scriptFile;
    if (file_exists($scriptPath)) {
        try {
            // Exécuter le script
            ob_start();
            include $scriptPath;
            $output = ob_get_clean();
            echo $output;
        } catch (Exception $e) {
            echo "❌ Erreur dans $scriptFile: " . $e->getMessage() . "\n";
        }
    } else {
        echo "❌ Script $scriptFile non trouvé\n";
    }
    
    echo "\n" . str_repeat('=', 50) . "\n\n";
}

echo "🏁 DIAGNOSTIC TERMINÉ\n";
echo "Si tous les tests passent, le problème d'authentification devrait être résolu.\n";
echo "Sinon, vérifiez les erreurs ci-dessus.\n";