#!/usr/bin/env php
<?php

/**
 * Script to identify unused/test files in the backend directory
 * Run this before cleanup to review files that can be deleted
 */

$backendDir = __DIR__;
$filesToCheck = [];

// Patterns for test/debug files
$patterns = [
    'test_*.php',
    'debug_*.php',
    'generate_*.php',
    'check_*.php',
    'fix_*.php',
    'populate_*.php',
    'seed_*.php',
    'update_*.php',
    'create_test_*.php',
    '*.html', // HTML test files in backend
    'list_*.php',
];

echo "🔍 Scanning for unused files in backend directory...\n\n";

foreach ($patterns as $pattern) {
    $files = glob($backendDir . '/' . $pattern);
    foreach ($files as $file) {
        $filename = basename($file);
        $filesize = filesize($file);
        $lastModified = date('Y-m-d H:i:s', filemtime($file));

        $filesToCheck[] = [
            'path' => $file,
            'name' => $filename,
            'size' => $filesize,
            'modified' => $lastModified,
        ];
    }
}

if (empty($filesToCheck)) {
    echo "✅ No test/debug files found!\n";
    exit(0);
}

echo "Found " . count($filesToCheck) . " files:\n";
echo str_repeat("=", 100) . "\n";
printf("%-50s %-15s %-20s\n", "Filename", "Size", "Last Modified");
echo str_repeat("=", 100) . "\n";

foreach ($filesToCheck as $file) {
    printf(
        "%-50s %-15s %-20s\n",
        $file['name'],
        formatBytes($file['size']),
        $file['modified']
    );
}

echo str_repeat("=", 100) . "\n";
echo "\n📝 Review these files and delete manually if not needed.\n";
echo "⚠️  DO NOT delete files that are actually used in production!\n\n";

echo "Files list:\n";
foreach ($filesToCheck as $file) {
    echo $file['path'] . "\n";
}

echo "\n";
echo "To delete all these files, run:\n";
echo "rm " . implode(' ', array_column($filesToCheck, 'path')) . "\n";

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . ' ' . $units[$pow];
}
