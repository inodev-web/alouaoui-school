<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Vérification des utilisateurs dans la base de données ===\n\n";

try {
    // Compter tous les utilisateurs
    $totalUsers = User::count();
    echo "Nombre total d'utilisateurs: {$totalUsers}\n\n";
    
    if ($totalUsers > 0) {
        echo "Liste des utilisateurs:\n";
        echo "ID | Nom | Email | Téléphone | Rôle | Statut\n";
        echo "---|-----|-------|-----------|------|-------\n";
        
        $users = User::all();
        foreach ($users as $user) {
            echo "{$user->id} | {$user->name} | {$user->email} | {$user->phone} | {$user->role} | {$user->status}\n";
        }
    } else {
        echo "Aucun utilisateur trouvé.\n";
        echo "Création d'un utilisateur admin...\n\n";
        
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@alouaoui-school.com',
            'phone' => '0555123456',
            'password' => bcrypt('123456789'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        
        echo "✅ Utilisateur admin créé avec succès!\n";
        echo "📧 Email: {$admin->email}\n";
        echo "📱 Téléphone: {$admin->phone}\n";
        echo "🔑 Mot de passe: 123456789\n";
    }
    
    // Vérifier l'utilisateur admin spécifique
    echo "\n=== Vérification de l'admin avec téléphone 0555123456 ===\n";
    $admin = User::where('phone', '0555123456')->first();
    
    if ($admin) {
        echo "✅ Admin trouvé:\n";
        echo "Nom: {$admin->name}\n";
        echo "Email: {$admin->email}\n";
        echo "Téléphone: {$admin->phone}\n";
        echo "Rôle: {$admin->role}\n";
        echo "Statut: {$admin->status}\n";
        echo "Créé le: {$admin->created_at}\n";
    } else {
        echo "❌ Aucun admin trouvé avec le téléphone 0555123456\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin de la vérification ===\n";