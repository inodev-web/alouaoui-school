<?php

/**
 * Test script for Dashboard API endpoints
 * Run this after starting the Laravel server
 */

$baseUrl = 'http://localhost:8000/api';

// Test endpoints (you'll need to replace with actual admin token)
$endpoints = [
    '/dashboard/data/cards?period=daily',
    '/dashboard/data/summary?period=daily',
    '/dashboard/data/top-teachers?limit=5&period=daily',
    '/dashboard/data/revenue-time-series?period=daily&days=30',
    '/dashboard/data/teacher-performance?period=daily',
    '/dashboard/data/refresh-status'
];

echo "Testing Dashboard API Endpoints\n";
echo "==============================\n\n";

foreach ($endpoints as $endpoint) {
    $url = $baseUrl . $endpoint;
    echo "Testing: $endpoint\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json',
        // Add your admin token here: 'Authorization: Bearer YOUR_TOKEN'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Status: $httpCode\n";
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['data'])) {
            echo "Data keys: " . implode(', ', array_keys($data['data'])) . "\n";
        } else {
            echo "Response: " . substr($response, 0, 100) . "...\n";
        }
    } else {
        echo "Error: " . substr($response, 0, 200) . "\n";
    }
    
    echo "\n" . str_repeat('-', 50) . "\n\n";
}

echo "Test completed!\n";
echo "Note: You may need to add an admin token to test protected endpoints.\n";
