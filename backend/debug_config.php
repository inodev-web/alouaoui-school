<?php

// Bootstrap Laravel to check where the error occurs
require_once __DIR__ . '/vendor/autoload.php';

try {
    echo "Testing environment variable loading...\n";

    // Test individual environment variables that might be problematic
    $appPreviousKeys = $_ENV['APP_PREVIOUS_KEYS'] ?? '';
    echo "APP_PREVIOUS_KEYS type: " . gettype($appPreviousKeys) . "\n";
    echo "APP_PREVIOUS_KEYS value: " . var_export($appPreviousKeys, true) . "\n";

    if (!is_string($appPreviousKeys)) {
        echo "ERROR: APP_PREVIOUS_KEYS is not a string!\n";
    }

    // Test the problematic explode call
    $exploded = explode(',', (string)$appPreviousKeys);
    echo "Exploded result: " . var_export($exploded, true) . "\n";

    $filtered = array_filter($exploded);
    echo "Filtered result: " . var_export($filtered, true) . "\n";

    echo "Environment variable test completed successfully.\n";

} catch (Exception $e) {
    echo "Error during environment test: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

try {
    echo "\nTesting Laravel app creation...\n";
    $app = require_once __DIR__ . '/bootstrap/app.php';
    echo "Laravel app created successfully.\n";
} catch (Exception $e) {
    echo "Error during Laravel app creation: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
