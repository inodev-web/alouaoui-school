<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Testing Teacher Students Count ===\n\n";

// Find alouaoui teacher
$teacher = Teacher::where('name', 'like', '%alouaoui%')->first();

if (!$teacher) {
    echo "❌ Teacher 'alouaoui' not found\n";
    exit(1);
}

echo "✅ Teacher found: {$teacher->name}\n";
echo "   UUID: {$teacher->uuid}\n\n";

// Method 1: Count with subscriptions (used in TeacherController)
$countMethod1 = User::where('role', 'student')
    ->whereHas('subscriptions', function($query) use ($teacher) {
        $query->where('teacher_uuid', $teacher->uuid)
              ->where('starts_at', '<=', now())
              ->where('ends_at', '>=', now());
    })
    ->count();

echo "📊 Method 1 (Controller): {$countMethod1} active students\n";

// Method 2: Direct subscription count
$countMethod2 = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', now())
    ->where('ends_at', '>=', now())
    ->distinct('user_uuid')
    ->count('user_uuid');

echo "📊 Method 2 (Distinct subscriptions): {$countMethod2} active students\n";

// Method 3: From materialized view (used in Dashboard)
$dashboardData = DB::table('teacher_performance')
    ->where('teacher_uuid', $teacher->uuid)
    ->where('period_type', 'daily')
    ->where('date', now()->format('Y-m-d'))
    ->first();

if ($dashboardData) {
    echo "📊 Method 3 (Dashboard view): {$dashboardData->active_students} active students\n";
} else {
    echo "⚠️  Method 3: No data in teacher_performance view for today\n";
}

// Debug: Check subscriptions table
echo "\n🔍 Debug Info:\n";
$totalSubs = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->count();
echo "   Total subscriptions: {$totalSubs}\n";

$activeSubs = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', now())
    ->where('ends_at', '>=', now())
    ->count();
echo "   Active subscriptions (today): {$activeSubs}\n";

// Sample subscriptions
$sampleSubs = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->limit(5)
    ->get(['user_uuid', 'starts_at', 'ends_at', 'created_at']);

echo "\n📋 Sample subscriptions:\n";
foreach ($sampleSubs as $sub) {
    echo "   - User: {$sub->user_uuid}, Start: {$sub->starts_at}, End: {$sub->ends_at}\n";
}

echo "\n✅ Test completed\n";
