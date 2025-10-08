<?php

require_once 'vendor/autoload.php';

$baseUrl = 'http://localhost:8000/api';

// Test de connexion admin
$loginData = [
    'login' => '0555123456',
    'password' => '123456789',
    'device_uuid' => 'test-device-admin'
];

echo "Testing admin login (multiple attempts)...\n";

// First login attempt
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "First Login - HTTP Code: $httpCode\n";
echo "First Login - Response: " . substr($response, 0, 100) . "...\n";

if ($httpCode === 200) {
    echo "✅ First login successful!\n";
    
    // Second login attempt with same device_uuid (should work for admin)
    echo "\nTesting second login with same device UUID...\n";
    
    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, $baseUrl . '/auth/login');
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    
    $response2 = curl_exec($ch2);
    $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);
    
    echo "Second Login - HTTP Code: $httpCode2\n";
    echo "Second Login - Response: " . substr($response2, 0, 100) . "...\n";
    
    if ($httpCode2 === 200) {
        echo "✅ Second login successful!\n";
        
        // Get token for API testing
        $data = json_decode($response2, true);
        if (isset($data['data']['token'])) {
            $token = $data['data']['token'];
            
            // Test profile access
            echo "\nTesting profile access...\n";
            
            $ch3 = curl_init();
            curl_setopt($ch3, CURLOPT_URL, $baseUrl . '/auth/profile');
            curl_setopt($ch3, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $token,
                'Accept: application/json'
            ]);
            curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
            
            $response3 = curl_exec($ch3);
            $httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
            curl_close($ch3);
            
            echo "Profile HTTP Code: $httpCode3\n";
            
            if ($httpCode3 === 200) {
                echo "✅ All admin access working!\n";
            } else {
                echo "❌ Profile access failed\n";
                echo "Profile Response: $response3\n";
            }
        }
    } else {
        echo "❌ Second login failed\n";
        echo "Full response: $response2\n";
    }
} else {
    echo "❌ First login failed\n";
    echo "Full response: $response\n";
}