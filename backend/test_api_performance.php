<?php

// Test API performance
echo "Testing API performance...\n\n";

// First, get a token
echo "1. Getting authentication token...\n";
$loginData = [
    'login' => '0555123456',  // L'API utilise 'login' au lieu de 'phone'
    'password' => '123456789'
];

$loginCurl = curl_init();
curl_setopt($loginCurl, CURLOPT_URL, 'http://127.0.0.1:8000/api/auth/login');
curl_setopt($loginCurl, CURLOPT_POST, true);
curl_setopt($loginCurl, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($loginCurl, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($loginCurl, CURLOPT_RETURNTRANSFER, true);

$start = microtime(true);
$loginResponse = curl_exec($loginCurl);
$loginTime = (microtime(true) - $start) * 1000;
$loginInfo = curl_getinfo($loginCurl);
curl_close($loginCurl);

echo "   Login time: " . round($loginTime, 2) . "ms\n";
echo "   HTTP Status: " . $loginInfo['http_code'] . "\n";

if ($loginInfo['http_code'] !== 200) {
    echo "   Login failed! Response: " . $loginResponse . "\n";
    exit(1);
}

$loginData = json_decode($loginResponse, true);
if (!isset($loginData['access_token'])) {
    echo "   No access token in response!\n";
    echo "   Response: " . $loginResponse . "\n";
    exit(1);
}

$token = $loginData['access_token'];
echo "   ✅ Login successful\n\n";

// Test users endpoint
echo "2. Testing users endpoint...\n";
$testEndpoints = [
    '/api/users?page=1&per_page=20',
    '/api/users?page=1&per_page=20&search=test',
    '/api/users?page=1&per_page=10',
];

foreach ($testEndpoints as $endpoint) {
    echo "   Testing: $endpoint\n";

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, 'http://127.0.0.1:8000' . $endpoint);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

    $start = microtime(true);
    $response = curl_exec($curl);
    $time = (microtime(true) - $start) * 1000;
    $info = curl_getinfo($curl);
    curl_close($curl);

    echo "     Time: " . round($time, 2) . "ms\n";
    echo "     Status: " . $info['http_code'] . "\n";

    if ($info['http_code'] === 200) {
        $data = json_decode($response, true);
        if (isset($data['data'])) {
            echo "     Records: " . count($data['data']) . "\n";
            if (isset($data['total'])) {
                echo "     Total: " . $data['total'] . "\n";
            }
        }
    } else {
        echo "     Error: " . $response . "\n";
    }
    echo "\n";
}

echo "=== API Performance Summary ===\n";
echo "Login: " . round($loginTime, 2) . "ms\n";
echo "If any endpoint takes > 100ms with 41 students, there's a performance issue.\n";
