<?php

/**
 * Script pour créer un utilisateur de test
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

echo "=== Création d'utilisateur de test ===\n";

try {
    // Supprimer l'utilisateur s'il existe déjà
    User::where('phone', '0123456789')->delete();
    
    $user = User::create([
        'uuid' => Str::uuid(),
        'firstname' => 'Student',
        'lastname' => 'Test', 
        'phone' => '0123456789',
        'password' => bcrypt('password'),
        'role' => 'student'
    ]);
    
    echo "✅ Utilisateur créé:\n";
    echo "  📞 Téléphone: {$user->phone}\n";
    echo "  🆔 UUID: {$user->uuid}\n";
    echo "  👤 Nom: {$user->firstname} {$user->lastname}\n";
    echo "  🔐 Mot de passe: password\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Fin ===\n";