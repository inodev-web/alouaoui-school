<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Teacher;
use App\Models\Subscription;
use Illuminate\Support\Carbon;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Revenue Details API Response ===\n\n";

// Find Alouaoui teacher
$teacher = Teacher::where('uuid', 'alouaoui-teacher-uuid-fixed')->first();

if (!$teacher) {
    echo "❌ Teacher not found\n";
    exit(1);
}

echo "✅ Teacher: {$teacher->name}\n";
echo "   UUID: {$teacher->uuid}\n\n";

// Simulate what the API returns
$oneMonthAgo = Carbon::now()->subMonth();
$now = Carbon::now();

// Get subscriptions from past month (for revenue calculation)
$subscriptionsLastMonth = Subscription::where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '>=', $oneMonthAgo)
    ->where('starts_at', '<=', $now)
    ->get();

// Get active subscriptions (current)
$activeSubscriptionsCount = Subscription::where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', $now)
    ->where('ends_at', '>=', $now)
    ->count();

// Get active students count
$activeStudentsCount = \App\Models\User::where('role', 'student')
    ->whereHas('subscriptions', function($query) use ($teacher, $now) {
        $query->where('teacher_uuid', $teacher->uuid)
              ->where('starts_at', '<=', $now)
              ->where('ends_at', '>=', $now);
    })
    ->count();

echo "📊 Statistics:\n";
echo "   Subscriptions (last month): {$subscriptionsLastMonth->count()}\n";
echo "   Active subscriptions (now): {$activeSubscriptionsCount}\n";
echo "   Active students (now):      {$activeStudentsCount}\n\n";

// Verify business rule
if ($activeSubscriptionsCount === $activeStudentsCount) {
    echo "✅ PASS: Active subscriptions = Active students (1:1 relationship maintained)\n";
} else {
    echo "❌ FAIL: Active subscriptions ({$activeSubscriptionsCount}) ≠ Active students ({$activeStudentsCount})\n";
    echo "   Difference: " . abs($activeSubscriptionsCount - $activeStudentsCount) . " duplicates!\n";
}

echo "\n📋 What the API should return:\n";
echo "   subscriptions.total:  {$subscriptionsLastMonth->count()} (created in past month)\n";
echo "   subscriptions.active: {$activeSubscriptionsCount} (currently active)\n";
echo "   students.active_count: {$activeStudentsCount} (unique active students)\n";

echo "\n✅ Test completed\n";
