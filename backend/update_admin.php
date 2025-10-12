<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Mise à jour de l'utilisateur admin ===\n\n";

try {
    // Trouver l'admin par téléphone
    $admin = User::where('phone', '0555123456')->first();
    
    if ($admin) {
        echo "Admin trouvé, mise à jour...\n";
        
        $admin->update([
            'name' => 'Administrator',
            'email' => 'admin@alouaoui-school.com',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        
        // Vérifier le mot de passe ou le mettre à jour
        if (!$admin->password) {
            $admin->update([
                'password' => bcrypt('123456789')
            ]);
            echo "Mot de passe mis à jour.\n";
        }
        
        echo "✅ Admin mis à jour avec succès!\n";
        echo "📧 Email: {$admin->email}\n";
        echo "📱 Téléphone: {$admin->phone}\n";
        echo "👤 Nom: {$admin->name}\n";
        echo "🔑 Mot de passe: 123456789\n";
        echo "📊 Rôle: {$admin->role}\n";
        echo "✅ Statut: {$admin->status}\n";
        
    } else {
        echo "❌ Admin non trouvé avec le téléphone 0555123456\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Fin de la mise à jour ===\n";