<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing student query performance...\n\n";

// Test 1: Simple count
$start = microtime(true);
$count = App\Models\User::where('role', 'student')->count();
$time1 = (microtime(true) - $start) * 1000;
echo "1. Count students: {$count} users in " . round($time1, 2) . "ms\n";

// Test 2: Select with pagination (comme dans le controller)
$start = microtime(true);
$students = App\Models\User::where('role', 'student')
    ->select('id', 'firstname', 'lastname', 'phone', 'birth_date', 'year')
    ->orderBy('created_at', 'desc')
    ->paginate(20);
$time2 = (microtime(true) - $start) * 1000;
echo "2. Paginated select: " . round($time2, 2) . "ms\n";

// Test 3: Search query
$start = microtime(true);
$searchTerm = 'test';
$students = App\Models\User::where('role', 'student')
    ->where(function($query) use ($searchTerm) {
        $query->where('firstname', 'LIKE', '%' . $searchTerm . '%')
              ->orWhere('lastname', 'LIKE', '%' . $searchTerm . '%')
              ->orWhere('phone', 'LIKE', '%' . $searchTerm . '%');
    })
    ->select('id', 'firstname', 'lastname', 'phone', 'birth_date', 'year')
    ->orderBy('created_at', 'desc')
    ->paginate(20);
$time3 = (microtime(true) - $start) * 1000;
echo "3. Search query: " . round($time3, 2) . "ms\n";

// Test 4: Check indexes
echo "\n4. Database indexes:\n";
try {
    $indexes = DB::select("PRAGMA index_list('users')");
    foreach($indexes as $index) {
        echo "   - {$index->name}\n";
        if ($index->name === 'users_search_index') {
            $info = DB::select("PRAGMA index_info('users_search_index')");
            echo "     Fields: ";
            foreach($info as $field) {
                echo $field->name . " ";
            }
            echo "\n";
        }
    }
} catch (Exception $e) {
    echo "   Error checking indexes: " . $e->getMessage() . "\n";
}

echo "\n=== Performance Summary ===\n";
echo "Count: " . round($time1, 2) . "ms\n";
echo "Paginated: " . round($time2, 2) . "ms\n";
echo "Search: " . round($time3, 2) . "ms\n";

if ($time2 > 100 || $time3 > 100) {
    echo "\n⚠️  SLOW QUERIES DETECTED!\n";
    echo "With only {$count} students, queries should be < 10ms\n";
} else {
    echo "\n✅ Performance looks good!\n";
}
