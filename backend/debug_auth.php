<?php

require_once 'vendor/autoload.php';

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class DebugAuth extends TestCase
{
    use RefreshDatabase;

    public function testAuthFlow()
    {
        $this->artisan('migrate');

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        echo "User created: " . json_encode($admin->toArray()) . "\n";

        $deviceUuid = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ], [
            'X-Device-UUID' => $deviceUuid,
        ]);

        echo "Login response status: " . $response->status() . "\n";
        echo "Login response body: " . $response->getContent() . "\n";
    }
}

$test = new DebugAuth();
$test->testAuthFlow();
