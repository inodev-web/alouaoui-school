<?php

/**
 * Script de test pour l'authentification Sanctum
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

echo "=== Test d'authentification Sanctum ===\n";

try {
    // Créer un utilisateur de test s'il n'existe pas
    $testPhone = '0987654321';
    $user = User::where('phone', $testPhone)->first();
    
    if (!$user) {
        echo "👤 Création d'un utilisateur de test...\n";
        $user = User::create([
            'uuid' => Str::uuid(),
            'firstname' => 'Test',
            'lastname' => 'User',
            'phone' => $testPhone,
            'password' => bcrypt('password123'),
            'role' => 'student',
            'device_uuid' => null,
        ]);
        echo "  ✓ Utilisateur créé: {$user->phone}\n";
    } else {
        echo "👤 Utilisateur de test trouvé: {$user->phone}\n";
    }
    
    // Test de création de token
    echo "\n🔑 Test de création de token...\n";
    $deviceUuid = Str::uuid();
    
    try {
        $token = $user->createToken($deviceUuid, ['student']);
        echo "  ✓ Token créé avec succès\n";
        echo "  🔑 Token: " . substr($token->plainTextToken, 0, 20) . "...\n";
        echo "  📱 Device UUID: $deviceUuid\n";
        
        // Vérifier que le token existe en base
        $tokenCount = DB::table('personal_access_tokens')->count();
        echo "  📊 Nombre total de tokens en base: $tokenCount\n";
        
        $userTokens = $user->tokens()->count();
        echo "  👤 Tokens pour cet utilisateur: $userTokens\n";
        
    } catch (Exception $e) {
        echo "  ❌ Erreur lors de la création du token: " . $e->getMessage() . "\n";
        throw $e;
    }
    
    // Test de validation du token
    echo "\n🔍 Test de validation du token...\n";
    try {
        $accessToken = $user->tokens()->first();
        if ($accessToken) {
            echo "  ✓ Token trouvé en base avec ID: {$accessToken->id}\n";
            echo "  📅 Créé le: {$accessToken->created_at}\n";
            echo "  🏷️  Nom: {$accessToken->name}\n";
        } else {
            echo "  ❌ Aucun token trouvé pour l'utilisateur\n";
        }
    } catch (Exception $e) {
        echo "  ❌ Erreur lors de la validation: " . $e->getMessage() . "\n";
    }
    
    // Test d'authentification via Sanctum Guard
    echo "\n🛡️  Test du guard Sanctum...\n";
    try {
        $guard = Auth::guard('sanctum');
        echo "  ✓ Guard Sanctum initialisé\n";
        
        // Simuler une requête avec le token
        $request = new Illuminate\Http\Request();
        $request->headers->set('Authorization', 'Bearer ' . $token->plainTextToken);
        
        // Le test du guard nécessiterait plus de configuration
        echo "  ℹ️  Test du guard nécessite une requête HTTP complète\n";
        
    } catch (Exception $e) {
        echo "  ❌ Erreur avec le guard: " . $e->getMessage() . "\n";
    }
    
    // Nettoyer
    echo "\n🧹 Nettoyage...\n";
    $user->tokens()->delete();
    $user->delete();
    echo "  ✓ Utilisateur et tokens de test supprimés\n";
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin du test ===\n";