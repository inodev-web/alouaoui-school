<?php

// More detailed debugging of environment loading
require_once __DIR__ . '/vendor/autoload.php';

echo "=== Environment Variable Debug ===\n";

// Load .env file manually to check for issues
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "Loading .env file: $envFile\n";
    $content = file_get_contents($envFile);
    echo "File size: " . strlen($content) . " bytes\n";

    // Check for potential problematic lines
    $lines = explode("\n", $content);
    foreach ($lines as $lineNum => $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Check if the value is problematic
            if (is_numeric($value) && !in_array($key, ['DB_PORT', 'REDIS_PORT', 'SESSION_LIFETIME', 'BCRYPT_ROUNDS'])) {
                echo "WARNING: Line " . ($lineNum + 1) . " - $key has numeric value: $value\n";
            }

            // Specifically check for keys that should be strings
            if (in_array($key, ['APP_PREVIOUS_KEYS', 'APP_NAME', 'APP_ENV']) && is_numeric($value)) {
                echo "ERROR: Line " . ($lineNum + 1) . " - $key should be string but appears numeric: $value\n";
            }
        }
    }
} else {
    echo ".env file not found\n";
}

echo "\n=== Testing Specific Environment Variables ===\n";

// Use Dotenv to load the environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Check specific variables that might cause array_merge issues
$problematicVars = [
    'APP_PREVIOUS_KEYS',
    'APP_NAME',
    'APP_ENV',
    'APP_KEY',
    'DB_CONNECTION',
    'CACHE_STORE',
    'SESSION_DRIVER',
    'QUEUE_CONNECTION'
];

foreach ($problematicVars as $var) {
    $value = $_ENV[$var] ?? null;
    $type = gettype($value);
    echo "$var: $type = " . var_export($value, true) . "\n";

    if ($value !== null && !is_string($value) && !is_bool($value)) {
        echo "  ^ WARNING: This should probably be a string!\n";
    }
}

echo "\n=== Testing Configuration Arrays ===\n";

// Test the specific configuration that's causing issues
try {
    $appPreviousKeys = $_ENV['APP_PREVIOUS_KEYS'] ?? '';
    echo "APP_PREVIOUS_KEYS: " . var_export($appPreviousKeys, true) . "\n";

    if (!is_string($appPreviousKeys)) {
        echo "ERROR: APP_PREVIOUS_KEYS is not a string: " . gettype($appPreviousKeys) . "\n";
        $_ENV['APP_PREVIOUS_KEYS'] = '';
        echo "Fixed APP_PREVIOUS_KEYS to empty string\n";
    }

    $exploded = explode(',', (string)$appPreviousKeys);
    $filtered = array_filter($exploded);
    $config = [...$filtered];
    echo "Successfully created config array: " . var_export($config, true) . "\n";

} catch (Exception $e) {
    echo "Error in array processing: " . $e->getMessage() . "\n";
}
