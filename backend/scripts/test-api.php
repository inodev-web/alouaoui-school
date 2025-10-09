<?php

/**
 * Script de test pour l'API d'authentification
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

echo "=== Test API d'authentification ===\n";

function makeApiRequest($method, $url, $data = null, $headers = []) {
    $baseUrl = 'http://localhost:8000';
    $fullUrl = $baseUrl . $url;
    
    $defaultHeaders = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    
    $allHeaders = array_merge($defaultHeaders, $headers);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $fullUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $allHeaders,
        CURLOPT_TIMEOUT => 10,
    ]);
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Erreur cURL: $error");
    }
    
    return [
        'code' => $httpCode,
        'body' => $response,
        'data' => json_decode($response, true)
    ];
}

try {
    // Créer un utilisateur de test
    echo "👤 Préparation de l'utilisateur de test...\n";
    $testPhone = '0555123456';
    $testPassword = 'testpass123';
    
    // Supprimer l'utilisateur s'il existe déjà
    User::where('phone', $testPhone)->delete();
    
    $user = User::create([
        'uuid' => Str::uuid(),
        'firstname' => 'API',
        'lastname' => 'Test',
        'phone' => $testPhone,
        'password' => bcrypt($testPassword),
        'role' => 'student',
        'device_uuid' => null,
    ]);
    echo "  ✓ Utilisateur créé: {$user->phone}\n";
    
    // Test 1: Login avec single_device = false
    echo "\n🔑 Test 1: Login avec single_device = false...\n";
    $deviceUuid = Str::uuid();
    $loginData = [
        'login' => $testPhone,
        'password' => $testPassword,
        'device_uuid' => $deviceUuid,
        'single_device' => false
    ];
    
    $response = makeApiRequest('POST', '/api/auth/login', $loginData);
    echo "  📊 Code HTTP: {$response['code']}\n";
    
    if ($response['code'] === 200) {
        echo "  ✅ Login réussi!\n";
        $responseData = $response['data'];
        
        if (isset($responseData['data']['token'])) {
            $token = $responseData['data']['token'];
            echo "  🔑 Token reçu: " . substr($token, 0, 20) . "...\n";
            
            // Vérifier en base
            $tokenCount = DB::table('personal_access_tokens')->count();
            echo "  📊 Tokens en base après login: $tokenCount\n";
            
            // Test 2: Appel d'une route protégée
            echo "\n🛡️  Test 2: Appel route protégée /api/auth/profile...\n";
            $headers = [
                "Authorization: Bearer $token",
                "X-Device-UUID: $deviceUuid"
            ];
            $profileResponse = makeApiRequest('GET', '/api/auth/profile', null, $headers);
            echo "  📊 Code HTTP: {$profileResponse['code']}\n";
            
            if ($profileResponse['code'] === 200) {
                echo "  ✅ Route protégée accessible!\n";
                $profileData = $profileResponse['data'];
                if (isset($profileData['data']['firstname'])) {
                    echo "  👤 Utilisateur: {$profileData['data']['firstname']} {$profileData['data']['lastname']}\n";
                } else {
                    echo "  👤 Utilisateur connecté (données disponibles)\n";
                }
            } else {
                echo "  ❌ Route protégée échoue\n";
                echo "  📝 Réponse: " . substr($profileResponse['body'], 0, 200) . "\n";
            }
            
            // Test 3: Route subscriptions
            echo "\n💳 Test 3: Route /api/subscriptions/active...\n";
            // Utiliser les mêmes en-têtes que pour le profil
            $subsResponse = makeApiRequest('GET', '/api/subscriptions/active', null, $headers);
            echo "  📊 Code HTTP: {$subsResponse['code']}\n";
            
            if ($subsResponse['code'] === 200) {
                echo "  ✅ Route subscriptions accessible!\n";
            } else {
                echo "  ❌ Route subscriptions échoue\n";
                echo "  📝 Réponse: " . substr($subsResponse['body'], 0, 200) . "\n";
            }
            
        } else {
            echo "  ❌ Pas de token dans la réponse\n";
            echo "  📝 Réponse: " . substr($response['body'], 0, 500) . "\n";
        }
    } else {
        echo "  ❌ Login échoué\n";
        echo "  📝 Réponse: " . substr($response['body'], 0, 500) . "\n";
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

echo "\n=== Fin du test ===\n";