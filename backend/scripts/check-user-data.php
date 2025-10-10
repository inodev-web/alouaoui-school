<?php

/**
 * Script pour vérifier les données d'un utilisateur
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== Vérification utilisateur de test ===\n";

try {
    $user = User::where('phone', '0123456789')->first();
    
    if ($user) {
        echo "✅ Utilisateur trouvé:\n";
        echo "  📞 Téléphone: " . ($user->phone ?? 'NULL') . "\n";
        echo "  🆔 UUID: " . ($user->uuid ?? 'NULL') . "\n";
        echo "  👤 Prénom: " . ($user->firstname ?? 'NULL') . "\n";
        echo "  👤 Nom: " . ($user->lastname ?? 'NULL') . "\n";
        echo "  🎂 Date naissance: " . ($user->birth_date ?? 'NULL') . "\n";
        echo "  🏠 Adresse: " . ($user->address ?? 'NULL') . "\n";
        echo "  🏫 École: " . ($user->school_name ?? 'NULL') . "\n";
        echo "  📚 Année d'étude: " . ($user->year_of_study ?? 'NULL') . "\n";
        echo "  🔒 Rôle: " . ($user->role ?? 'NULL') . "\n";
        echo "  📱 Device UUID: " . ($user->device_uuid ?? 'NULL') . "\n";
        echo "  🖼️  Photo: " . ($user->picture ?? 'NULL') . "\n";
        echo "  📅 Dernière MAJ: " . ($user->last_profile_update_at ?? 'NULL') . "\n";
    } else {
        echo "❌ Utilisateur non trouvé\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Fin ===\n";