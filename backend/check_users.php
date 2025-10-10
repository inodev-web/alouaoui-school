<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Users in database ===\n\n";

echo "Admin users:\n";
$admins = App\Models\User::where('role', 'admin')->get(['id', 'firstname', 'lastname', 'phone']);
foreach ($admins as $admin) {
    echo "  ID: {$admin->id}, Name: {$admin->firstname} {$admin->lastname}, Phone: {$admin->phone}\n";
}

echo "\nFirst few students:\n";
$students = App\Models\User::where('role', 'student')->take(3)->get(['id', 'firstname', 'lastname', 'phone']);
foreach ($students as $student) {
    echo "  ID: {$student->id}, Name: {$student->firstname} {$student->lastname}, Phone: {$student->phone}\n";
}
