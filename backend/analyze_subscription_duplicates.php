<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Analyse Active Subscriptions vs Active Students ===\n\n";

// Find alouaoui teacher
$teacher = Teacher::where('name', 'like', '%alouaoui%')->first();

if (!$teacher) {
    echo "❌ Teacher 'alouaoui' not found\n";
    exit(1);
}

echo "✅ Teacher: {$teacher->name} (UUID: {$teacher->uuid})\n\n";

// 1. Count active subscriptions
$activeSubs = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', now())
    ->where('ends_at', '>=', now())
    ->count();

echo "📊 Active subscriptions (total): {$activeSubs}\n";

// 2. Count DISTINCT active students
$activeStudents = DB::table('subscriptions')
    ->where('teacher_uuid', $teacher->uuid)
    ->where('starts_at', '<=', now())
    ->where('ends_at', '>=', now())
    ->distinct('user_uuid')
    ->count('user_uuid');

echo "📊 Active students (distinct): {$activeStudents}\n";

// 3. Calculate difference
$difference = $activeSubs - $activeStudents;
echo "\n⚠️  Difference: {$difference} subscriptions\n\n";

if ($difference > 0) {
    echo "🔍 ANALYSE: Pourquoi {$difference} subscriptions en plus?\n\n";

    // Find students with multiple active subscriptions
    $duplicates = DB::table('subscriptions')
        ->select('user_uuid', DB::raw('COUNT(*) as sub_count'))
        ->where('teacher_uuid', $teacher->uuid)
        ->where('starts_at', '<=', now())
        ->where('ends_at', '>=', now())
        ->groupBy('user_uuid')
        ->having('sub_count', '>', 1)
        ->get();

    if ($duplicates->count() > 0) {
        echo "❌ PROBLÈME TROUVÉ: {$duplicates->count()} étudiants ont PLUSIEURS abonnements actifs!\n\n";

        $totalDuplicateSubs = 0;
        foreach ($duplicates as $dup) {
            $totalDuplicateSubs += $dup->sub_count;

            // Get user info
            $user = User::find($dup->user_uuid);
            $userName = $user ? "{$user->firstname} {$user->lastname}" : "Unknown";

            echo "   Student: {$userName} (UUID: {$dup->user_uuid})\n";
            echo "   Active subscriptions: {$dup->sub_count}\n";

            // Get details of their subscriptions
            $subs = DB::table('subscriptions')
                ->where('teacher_uuid', $teacher->uuid)
                ->where('user_uuid', $dup->user_uuid)
                ->where('starts_at', '<=', now())
                ->where('ends_at', '>=', now())
                ->get(['id', 'starts_at', 'ends_at', 'created_at']);

            foreach ($subs as $sub) {
                echo "      └─ ID: {$sub->id}, Period: {$sub->starts_at} → {$sub->ends_at}\n";
            }
            echo "\n";
        }

        echo "📊 Total subscriptions from duplicates: {$totalDuplicateSubs}\n";
        echo "📊 Extra subscriptions caused by duplicates: " . ($totalDuplicateSubs - $duplicates->count()) . "\n\n";

        // Verify if this explains the difference
        $expectedDiff = $totalDuplicateSubs - $duplicates->count();
        if ($expectedDiff == $difference) {
            echo "✅ EXPLICATION TROUVÉE: Les doublons expliquent exactement la différence!\n";
        } else {
            echo "⚠️  ATTENTION: Les doublons ({$expectedDiff}) n'expliquent pas toute la différence ({$difference})\n";
        }
    } else {
        echo "✅ Aucun étudiant avec plusieurs abonnements actifs\n";
        echo "⚠️  La différence vient d'autre chose...\n\n";

        // Check for orphan subscriptions (user doesn't exist)
        $orphans = DB::table('subscriptions')
            ->leftJoin('users', 'subscriptions.user_uuid', '=', 'users.uuid')
            ->where('subscriptions.teacher_uuid', $teacher->uuid)
            ->where('subscriptions.starts_at', '<=', now())
            ->where('subscriptions.ends_at', '>=', now())
            ->whereNull('users.uuid')
            ->count();

        if ($orphans > 0) {
            echo "❌ PROBLÈME: {$orphans} subscriptions ORPHELINES (user n'existe plus)\n";
        }
    }
}

echo "\n✅ Analyse terminée\n";
