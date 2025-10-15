<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Session;
use App\Models\Branch;

echo "=== Testing Session Branch Filtering ===\n\n";

// Get all branches
$branches = Branch::all();
echo "Available branches:\n";
foreach ($branches as $branch) {
    echo "  - ID: {$branch->id}, Code: {$branch->code}, Name: {$branch->name}\n";
}
echo "\n";

// Get all sessions with their branches
$sessions = Session::with('branches', 'teacher')->get();
echo "Total sessions: " . $sessions->count() . "\n\n";

// Show sessions with multiple branches
echo "Sessions with multiple branches:\n";
foreach ($sessions as $session) {
    if ($session->branches->count() > 1) {
        $teacherName = $session->teacher ? $session->teacher->name : 'No teacher';
        echo "Session {$session->id} - {$teacherName}:\n";
        echo "  Single branch_id: " . ($session->branch_id ? $session->branch_id : 'NULL') . "\n";
        echo "  Multiple branches (" . $session->branches->count() . "): ";
        foreach ($session->branches as $branch) {
            echo "{$branch->code} ";
        }
        echo "\n\n";
    }
}

// Test filter for specific branch
if ($branches->count() > 0) {
    // Test with branch ID 17 (Electrical Engineering - should match session 34)
    $testBranchId = 17;
    $testBranch = Branch::find($testBranchId);
    
    if ($testBranch) {
        echo "\n=== Testing filter for branch ID: {$testBranchId} ({$testBranch->code}) ===\n";
        
        $filteredSessions = Session::with(['teacher', 'branches'])
            ->where(function ($q) use ($testBranchId) {
                $q->where('branch_id', $testBranchId)
                  ->orWhereHas('branches', function ($branchQuery) use ($testBranchId) {
                      $branchQuery->where('branches.id', $testBranchId);
                  });
            })
            ->get();
        
        echo "Found {$filteredSessions->count()} sessions\n";
        foreach ($filteredSessions as $session) {
            echo "  - Session {$session->id}: branch_id={$session->branch_id}, ";
            echo "branches=";
            foreach ($session->branches as $b) {
                echo "{$b->id}({$b->code}) ";
            }
            echo "\n";
        }
        
        // Expected: Session 34 should be in results because it has branch 17 in pivot table
        echo "\nExpected: Session 34 should appear (has branches 17 and 19 in pivot)\n";
    }
}
