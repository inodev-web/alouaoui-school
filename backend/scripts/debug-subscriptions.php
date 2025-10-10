<?php

/**
 * Script de debug spécifique pour la route subscriptions
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

echo "=== Debug route subscriptions ===\n";

try {
    // Créer un utilisateur de test
    echo "👤 Préparation de l'utilisateur de test...\n";
    $testPhone = '0555999888';
    $testPassword = 'testpass123';
    
    // Supprimer l'utilisateur s'il existe déjà
    User::where('phone', $testPhone)->delete();
    
    $user = User::create([
        'uuid' => Str::uuid(),
        'firstname' => 'Debug',
        'lastname' => 'User',
        'phone' => $testPhone,
        'password' => bcrypt($testPassword),
        'role' => 'student',
        'device_uuid' => null,
    ]);
    echo "  ✓ Utilisateur créé: {$user->phone}\n";
    
    // Créer un token directement
    echo "\n🔑 Création directe du token...\n";
    $deviceUuid = Str::uuid();
    $token = $user->createToken($deviceUuid, ['student']);
    echo "  ✓ Token créé: " . substr($token->plainTextToken, 0, 20) . "...\n";
    
    // Simuler une requête Sanctum interne
    echo "\n🔍 Test de validation du token Sanctum...\n";
    
    // Simuler la validation du token comme le ferait Sanctum
    $tokenParts = explode('|', $token->plainTextToken);
    if (count($tokenParts) === 2) {
        $tokenHash = hash('sha256', $tokenParts[1]);
        echo "  🔍 Recherche du token avec hash: " . substr($tokenHash, 0, 20) . "...\n";
        
        $personalAccessToken = Laravel\Sanctum\PersonalAccessToken::where('token', $tokenHash)->first();
        
        if ($personalAccessToken) {
            echo "  ✓ Token trouvé dans la base\n";
            echo "  📋 ID: {$personalAccessToken->id}\n";
            echo "  👤 User ID: {$personalAccessToken->tokenable_id}\n";
            echo "  🏷️  Nom: {$personalAccessToken->name}\n";
            
            // Vérifier l'utilisateur associé
            $tokenUser = $personalAccessToken->tokenable;
            if ($tokenUser) {
                echo "  ✓ Utilisateur associé trouvé: {$tokenUser->phone}\n";
            } else {
                echo "  ❌ Utilisateur associé non trouvé\n";
            }
        } else {
            echo "  ❌ Token non trouvé dans la base\n";
            
            // Vérifier combien de tokens existent
            $tokenCount = Laravel\Sanctum\PersonalAccessToken::count();
            echo "  📊 Nombre total de tokens en base: $tokenCount\n";
            
            // Vérifier les tokens de l'utilisateur
            $userTokens = $user->tokens()->count();
            echo "  👤 Tokens pour cet utilisateur: $userTokens\n";
        }
    } else {
        echo "  ❌ Format de token invalide\n";
    }
    
    // Test de l'API avec cURL plus détaillé
    echo "\n🌐 Test HTTP détaillé...\n";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'http://localhost:8000/api/subscriptions/active',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $token->plainTextToken,
            'X-Device-UUID: ' . $deviceUuid,
        ],
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    echo "  📊 Code HTTP: $httpCode\n";
    echo "  📝 Réponse: $response\n";
    
    if ($error) {
        echo "  ❌ Erreur cURL: $error\n";
    }
    
    // Nettoyer
    echo "\n🧹 Nettoyage...\n";
    DB::table('personal_access_tokens')->where('tokenable_id', $user->id)->delete();
    $user->delete();
    echo "  ✓ Données de test supprimées\n";
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin du debug ===\n";