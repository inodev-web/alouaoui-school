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
        $teacher = Teacher::firstOrCreate([
            'uuid' => Teacher::ALOUAOUI_UUID
        ], [
            'name' => 'Alouaoui',
            'phone' => '0555000001',
            'picture' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
            'module' => 'Mathématiques',
            'is_online_publisher' => true,
            'price_subscription' => 2000.00,
            'price_session' => 500.00,
            'percent_school' => 20,
        ]);

        // Assigner les années via la table pivot
        $teacher->setTeachingYears(['3AS', '2AS']); // Alouaoui enseigne plusieurs niveaux

        // Créer quelques autres professeurs pour tester
        $teacher2 = Teacher::firstOrCreate([
            'name' => 'Ahmed Benali'
        ], [
            'phone' => '0555000002',
            'picture' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format',
            'module' => 'Physique',
            'is_online_publisher' => false,
            'price_subscription' => 1500.00,
            'price_session' => 400.00,
            'percent_school' => 25,
        ]);
        $teacher2->setTeachingYears(['2AM', '3AM']);

        $teacher3 = Teacher::firstOrCreate([
            'name' => 'Fatima Khadra'
        ], [
            'phone' => '0555000003',
            'picture' => 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format',
            'module' => 'Arabe',
            'is_online_publisher' => true,
            'price_subscription' => 1800.00,
            'price_session' => 450.00,
            'percent_school' => 22,
        ]);
        $teacher3->setTeachingYears(['1AM', '2AM', '3AM', '1AS']);
    }
}
