<?php

echo "Testing login endpoint...\n";

// Load Laravel
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    // Test with JSON data like frontend would send
    $jsonData = json_encode([
        'login' => '0555123456',
        'password' => 'password123',
        'device_uuid' => 'test-device-uuid',
        'single_device' => true
    ]);

    $request = Illuminate\Http\Request::create('/api/auth/login', 'POST', [], [], [], [], $jsonData);

    $request->headers->set('Accept', 'application/json');
    $request->headers->set('Content-Type', 'application/json');

    echo "Request data: " . $jsonData . "\n";
    echo "Request content: " . $request->getContent() . "\n";
    echo "Request all data: " . json_encode($request->all()) . "\n";

    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
