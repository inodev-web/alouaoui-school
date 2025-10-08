<?php

require_once 'vendor/autoload.php';

$baseUrl = 'http://localhost:8000/api';

// Test de connexion admin
$loginData = [
    'login' => '0555123456',
    'password' => '123456789',
    'device_uuid' => 'test-device-admin'
];

echo "Testing admin login...\n";

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

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['data']['token'])) {
        echo "\n✅ Login successful!\n";
        echo "Token: " . substr($data['data']['token'], 0, 20) . "...\n";
        echo "User Role: " . $data['data']['user']['role'] . "\n";
        
        // Test access to admin route (courses listing)
        echo "\nTesting admin route access (courses)...\n";
        $token = $data['data']['token'];
        
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, $baseUrl . '/courses');
        curl_setopt($ch2, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ]);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        
        $response2 = curl_exec($ch2);
        $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);
        
        echo "Admin route HTTP Code: $httpCode2\n";
        echo "Admin route Response: " . substr($response2, 0, 200) . "...\n";
        
        if ($httpCode2 === 200) {
            echo "✅ Admin access working!\n";
        } else {
            echo "❌ Admin access denied\n";
        }
        
        // Test access to video management (admin route)
        echo "\nTesting admin video management...\n";
        
        $ch3 = curl_init();
        curl_setopt($ch3, CURLOPT_URL, $baseUrl . '/videos');
        curl_setopt($ch3, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ]);
        curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
        
        $response3 = curl_exec($ch3);
        $httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
        curl_close($ch3);
        
        echo "Video route HTTP Code: $httpCode3\n";
        echo "Video route Response: " . substr($response3, 0, 200) . "...\n";
        
        if ($httpCode3 === 200) {
            echo "✅ Admin video access working!\n";
        } else {
            echo "❌ Admin video access denied\n";
        }
        
        // Test profile access
        echo "\nTesting admin profile access...\n";
        
        $ch4 = curl_init();
        curl_setopt($ch4, CURLOPT_URL, $baseUrl . '/auth/profile');
        curl_setopt($ch4, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ]);
        curl_setopt($ch4, CURLOPT_RETURNTRANSFER, true);
        
        $response4 = curl_exec($ch4);
        $httpCode4 = curl_getinfo($ch4, CURLINFO_HTTP_CODE);
        curl_close($ch4);
        
        echo "Profile route HTTP Code: $httpCode4\n";
        echo "Profile route Response: " . substr($response4, 0, 200) . "...\n";
        
        if ($httpCode4 === 200) {
            echo "✅ Admin profile access working!\n";
        } else {
            echo "❌ Admin profile access denied\n";
        }
    }
} else {
    echo "❌ Login failed\n";
}