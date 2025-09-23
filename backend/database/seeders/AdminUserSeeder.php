<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user only if it doesn't exist
        if (!\App\Models\User::where('email', 'admin@alouaoui-school.com')->exists()) {
            $admin = \App\Models\User::create([
                'name' => 'Admin Alouaoui',
                'email' => 'admin@alouaoui-school.com',
                'phone' => '0555123456',
                'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
                'role' => 'admin',
                'qr_token' => \Illuminate\Support\Str::uuid(),
            ]);
            echo "✅ Admin user created: admin@alouaoui-school.com / admin123\n";
        } else {
            echo "ℹ️  Admin user already exists\n";
        }

        // Create a sample student only if it doesn't exist
        if (!\App\Models\User::where('email', 'ahmed@example.com')->exists()) {
            $student = \App\Models\User::create([
                'name' => 'Ahmed Benali',
                'email' => 'ahmed@example.com',
                'phone' => '0666789123',
                'password' => \Illuminate\Support\Facades\Hash::make('student123'),
                'role' => 'student',
                'year_of_study' => '2AM',
                'qr_token' => \Illuminate\Support\Str::uuid(),
            ]);
            echo "✅ Student created: ahmed@example.com / student123\n";
        } else {
            echo "ℹ️  Student already exists\n";
        }

        // Create Alouaoui teacher only if it doesn't exist
        if (!\App\Models\Teacher::where('email', 'alouaoui@school.com')->exists()) {
            $alouaouiTeacher = \App\Models\Teacher::create([
                'name' => 'Prof. Alouaoui Mohamed',
                'email' => 'alouaoui@school.com',
                'phone' => '0777888999',
                'specialization' => 'Mathématiques',
                'bio' => 'Professeur principal de mathématiques avec 15 ans d\'expérience.',
                'is_alouaoui_teacher' => true,
                'is_active' => true,
            ]);
            echo "✅ Alouaoui teacher created: {$alouaouiTeacher->name}\n";
        } else {
            echo "ℹ️  Alouaoui teacher already exists\n";
        }

        // Create regular teacher only if it doesn't exist
        if (!\App\Models\Teacher::where('email', 'karim@school.com')->exists()) {
            $regularTeacher = \App\Models\Teacher::create([
                'name' => 'Prof. Karim Slimani',
                'email' => 'karim@school.com',
                'phone' => '0666555444',
                'specialization' => 'Physique',
                'bio' => 'Professeur de physique, cours en présentiel uniquement.',
                'is_alouaoui_teacher' => false,
                'is_active' => true,
            ]);
            echo "✅ Regular teacher created: {$regularTeacher->name}\n";
        } else {
            echo "ℹ️  Regular teacher already exists\n";
        }
    }
}
