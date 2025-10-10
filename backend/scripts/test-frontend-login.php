<?php

/**
 * Script pour tester le processus de login complet et diagnostiquer le token
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

echo "=== Test de Login Complet ===\n";

try {
    // Créer un utilisateur de test
    echo "👤 Création d'un utilisateur de test...\n";
    $testPhone = '0666777888';
    $testPassword = 'password123';
    
    // Supprimer l'utilisateur s'il existe déjà
    User::where('phone', $testPhone)->delete();
    
    $user = User::create([
        'uuid' => Str::uuid(),
        'firstname' => 'Frontend',
        'lastname' => 'Test',
        'phone' => $testPhone,
        'password' => bcrypt($testPassword),
        'role' => 'student',
        'device_uuid' => null,
    ]);
    echo "  ✓ Utilisateur créé: {$user->phone}\n";
    echo "  🆔 UUID: {$user->uuid}\n";
    
    // Simuler le login frontend
    echo "\n🔑 Test du login comme le ferait le frontend...\n";
    $deviceUuid = Str::uuid();
    
    // Simuler la requête POST /api/auth/login
    $loginData = [
        'login' => $testPhone,
        'password' => $testPassword,
        'device_uuid' => $deviceUuid,
        'single_device' => false
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'http://localhost:8000/api/auth/login',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($loginData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "  📊 Code HTTP: $httpCode\n";
    
    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        echo "  ✅ Login réussi!\n";
        
        if (isset($responseData['data']['token'])) {
            $token = $responseData['data']['token'];
            echo "  🔑 Token reçu: " . substr($token, 0, 30) . "...\n";
            
            // Vérifier immédiatement le token en base
            echo "\n📋 Vérification du token en base...\n";
            $tokenParts = explode('|', $token);
            if (count($tokenParts) === 2) {
                $tokenHash = hash('sha256', $tokenParts[1]);
                $personalAccessToken = Laravel\Sanctum\PersonalAccessToken::where('token', $tokenHash)->first();
                
                if ($personalAccessToken) {
                    echo "  ✅ Token trouvé en base (ID: {$personalAccessToken->id})\n";
                    echo "  👤 User UUID: {$personalAccessToken->tokenable->uuid}\n";
                    echo "  📱 Device: {$personalAccessToken->name}\n";
                } else {
                    echo "  ❌ Token non trouvé en base!\n";
                }
            }
            
            // Test immédiat de l'endpoint profile
            echo "\n👤 Test endpoint /api/auth/profile...\n";
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'http://localhost:8000/api/auth/profile',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                    'Authorization: Bearer ' . $token,
                    'X-Device-UUID: ' . $deviceUuid,
                ],
                CURLOPT_TIMEOUT => 10,
            ]);
            
            $profileResponse = curl_exec($ch);
            $profileHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            echo "  📊 Code HTTP: $profileHttpCode\n";
            if ($profileHttpCode === 200) {
                echo "  ✅ Profile accessible\n";
            } else {
                echo "  ❌ Profile inaccessible: $profileResponse\n";
            }
            
            // Test immédiat de l'endpoint subscriptions
            echo "\n💳 Test endpoint /api/subscriptions/active...\n";
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'http://localhost:8000/api/subscriptions/active',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                    'Authorization: Bearer ' . $token,
                    'X-Device-UUID: ' . $deviceUuid,
                ],
                CURLOPT_TIMEOUT => 10,
            ]);
            
            $subsResponse = curl_exec($ch);
            $subsHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            echo "  📊 Code HTTP: $subsHttpCode\n";
            if ($subsHttpCode === 200) {
                echo "  ✅ Subscriptions accessible\n";
                echo "  📋 Réponse: $subsResponse\n";
            } else {
                echo "  ❌ Subscriptions inaccessible: $subsResponse\n";
            }
            
        } else {
            echo "  ❌ Pas de token dans la réponse\n";
            echo "  📝 Réponse: $response\n";
        }
    } else {
        echo "  ❌ Login échoué\n";
        echo "  📝 Réponse: $response\n";
        if ($error) echo "  🔴 Erreur cURL: $error\n";
    }
    
    // Nettoyer
    echo "\n🧹 Nettoyage...\n";
    DB::table('personal_access_tokens')->where('tokenable_id', $user->uuid)->delete();
    $user->delete();
    echo "  ✓ Données de test supprimées\n";
    
} catch (Exception $e) {
    echo "❌ Erreur critique: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Fin du test ===\n";