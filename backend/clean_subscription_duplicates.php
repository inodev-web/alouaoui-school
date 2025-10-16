<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Nettoyage des Doublons d'Abonnements ===\n\n";

// Find all students with multiple active subscriptions for the same teacher
$now = now()->toDateTimeString();
$duplicates = DB::select("
    SELECT teacher_uuid, user_uuid, COUNT(*) as count
    FROM subscriptions
    WHERE starts_at <= ?
    AND ends_at >= ?
    GROUP BY teacher_uuid, user_uuid
    HAVING count > 1
", [$now, $now]);

echo "🔍 Trouvé: " . count($duplicates) . " combinaisons teacher-student avec doublons\n\n";

$totalDeleted = 0;
$dryRun = false; // ACTIVATED: Will actually delete duplicates

foreach ($duplicates as $dup) {
    // Get all active subscriptions for this teacher-student pair
    $subs = DB::table('subscriptions')
        ->where('teacher_uuid', $dup->teacher_uuid)
        ->where('user_uuid', $dup->user_uuid)
        ->where('starts_at', '<=', now())
        ->where('ends_at', '>=', now())
        ->orderBy('created_at', 'desc') // Keep the most recent
        ->get();

    if ($subs->count() > 1) {
        // Keep the first (most recent), delete the rest
        $toKeep = $subs->first();
        $toDelete = $subs->skip(1);

        echo "Student: {$dup->user_uuid}\n";
        echo "Teacher: {$dup->teacher_uuid}\n";
        echo "Total subscriptions: {$subs->count()}\n";
        echo "  ✅ KEEP: ID {$toKeep->id} (created: {$toKeep->created_at})\n";

        foreach ($toDelete as $sub) {
            echo "  ❌ DELETE: ID {$sub->id} (created: {$sub->created_at})\n";
            $totalDeleted++;

            if (!$dryRun) {
                DB::table('subscriptions')->where('id', $sub->id)->delete();
            }
        }
        echo "\n";
    }
}

echo "\n📊 Résumé:\n";
echo "   Doublons trouvés: " . count($duplicates) . "\n";
echo "   Subscriptions à supprimer: {$totalDeleted}\n";

if ($dryRun) {
    echo "\n⚠️  MODE DRY-RUN: Aucune suppression effectuée\n";
    echo "   Pour supprimer réellement, changez \$dryRun = false dans le script\n";
} else {
    echo "\n✅ Suppressions effectuées!\n";
}

echo "\n✅ Script terminé\n";
