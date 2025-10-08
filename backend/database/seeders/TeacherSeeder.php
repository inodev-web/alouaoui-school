<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Teacher;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Alouaoui teacher with fixed UUID
        Teacher::firstOrCreate([
            'uuid' => Teacher::ALOUAOUI_UUID
        ], [
            'name' => 'Alouaoui',
            'phone' => '0555000001',
            'module' => 'Mathématiques',
            'year' => '3AS',
            'is_online_publisher' => true,
            'price_subscription' => 2000.00,
            'price_session' => 500.00,
            'percent_school' => 20,
        ]);
    }
}
