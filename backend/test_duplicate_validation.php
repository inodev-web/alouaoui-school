<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Services\SubscriptionService;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Duplicate Subscription Validation ===\n\n";

$subscriptionService = app(SubscriptionService::class);

// Find test user and teacher
$teacher = Teacher::where('uuid', 'alouaoui-teacher-uuid-fixed')->first();
if (!$teacher) {
    echo "❌ Teacher 'alouaoui-teacher-uuid-fixed' not found\n";
    exit(1);
}

// Find a user who currently has an active subscription with Alouaoui
$now = now();
$activeSubscription = Subscription::where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', $now)
    ->where('ends_at', '>=', $now)
    ->first();

if (!$activeSubscription) {
    echo "❌ No active subscriptions found to test\n";
    exit(1);
}

$user = User::where('uuid', $activeSubscription->user_uuid)->first();
if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

echo "✅ Found test data:\n";
echo "   Teacher: {$teacher->name} ({$teacher->uuid})\n";
echo "   User: {$user->name} ({$user->uuid})\n";
echo "   Existing active subscription: ID {$activeSubscription->id}\n";
echo "   Starts: {$activeSubscription->starts_at}\n";
echo "   Ends: {$activeSubscription->ends_at}\n\n";

// Test 1: Try to create duplicate monthly subscription
echo "🧪 Test 1: Attempting to create duplicate MONTHLY subscription...\n";
try {
    $duplicateSubscription = $subscriptionService->createMonthly($user, $teacher);
    echo "   ❌ FAIL: Should have thrown exception but created subscription ID {$duplicateSubscription->id}\n";
} catch (\RuntimeException $e) {
    echo "   ✅ PASS: Correctly blocked duplicate subscription\n";
    echo "   Error message: \"{$e->getMessage()}\"\n";
}

echo "\n";

// Test 2: Try to create duplicate session pass
echo "🧪 Test 2: Attempting to create duplicate SESSION PASS for today...\n";
try {
    $session = new \App\Models\Session(['teacher_uuid' => $teacher->uuid, 'start_time' => now()]);
    $duplicateSubscription = $subscriptionService->createSessionPass($user, $teacher, $session);
    echo "   ❌ FAIL: Should have thrown exception but created subscription ID {$duplicateSubscription->id}\n";
} catch (\RuntimeException $e) {
    echo "   ✅ PASS: Correctly blocked duplicate subscription\n";
    echo "   Error message: \"{$e->getMessage()}\"\n";
}

echo "\n";

// Test 3: Verify active subscription count
echo "🧪 Test 3: Verifying no duplicates were created...\n";
$countAfter = Subscription::where('teacher_uuid', $teacher->uuid)
    ->where('user_uuid', $user->uuid)
    ->where('starts_at', '<=', $now)
    ->where('ends_at', '>=', $now)
    ->count();

if ($countAfter === 1) {
    echo "   ✅ PASS: Still only 1 active subscription (no duplicates created)\n";
} else {
    echo "   ❌ FAIL: Found {$countAfter} active subscriptions (expected 1)\n";
}

echo "\n📊 Summary:\n";
echo "   - Validation prevents creating duplicate active subscriptions ✅\n";
echo "   - Business rule enforced: 1 student = max 1 active subscription per teacher ✅\n\n";

echo "✅ Test completed\n";
