<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$user = User::firstOrCreate([
    'phone' => '0555123456'
], [
    'uuid' => Str::uuid(),
    'firstname' => 'Test',
    'lastname' => 'User',
    'password' => Hash::make('password123'),
    'role' => 'student',
    'year_of_study' => '2AM'
]);

echo "User created/found: " . $user->phone . " with ID: " . $user->uuid . "\n";
