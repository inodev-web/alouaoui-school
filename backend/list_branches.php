<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Liste des Branches:\n";
echo "===================\n\n";

$branches = DB::table('branches')
    ->orderBy('year_level')
    ->orderBy('name')
    ->get(['id', 'name', 'code', 'year_level']);

foreach ($branches as $branch) {
    echo sprintf(
        "ID: %d | Année: %s | Nom: %s | Code: %s\n",
        $branch->id,
        $branch->year_level,
        $branch->name,
        $branch->code
    );
}

echo "\nTotal: " . $branches->count() . " branches\n";
