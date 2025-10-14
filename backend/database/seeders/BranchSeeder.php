<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            // First year high school (1AS)
            [
                'name' => 'علمي',
                'name_en' => 'Scientific',
                'code' => '1AS_SCIENTIFIC',
                'year_level' => '1AS',
                'sort_order' => 1,
            ],
            [
                'name' => 'أدبي',
                'name_en' => 'Literary',
                'code' => '1AS_LITERARY',
                'year_level' => '1AS',
                'sort_order' => 2,
            ],

            // Second year high school (2AS)
            [
                'name' => 'علوم تجريبية',
                'name_en' => 'Experimental Sciences',
                'code' => '2AS_EXPERIMENTAL',
                'year_level' => '2AS',
                'sort_order' => 1,
            ],
            [
                'name' => 'رياضيات',
                'name_en' => 'Mathematics',
                'code' => '2AS_MATHEMATICS',
                'year_level' => '2AS',
                'sort_order' => 2,
            ],
            [
                'name' => 'تسيير و اقتصاد',
                'name_en' => 'Management and Economics',
                'code' => '2AS_MANAGEMENT',
                'year_level' => '2AS',
                'sort_order' => 3,
            ],
            [
                'name' => 'آداب و فلسفة',
                'name_en' => 'Literature and Philosophy',
                'code' => '2AS_LITERATURE',
                'year_level' => '2AS',
                'sort_order' => 4,
            ],
            [
                'name' => 'لغات أجنبية',
                'name_en' => 'Foreign Languages',
                'code' => '2AS_FOREIGN_LANGUAGES',
                'year_level' => '2AS',
                'sort_order' => 5,
            ],

            // Third year high school (3AS)
            [
                'name' => 'هندسة كهربائية',
                'name_en' => 'Electrical Engineering',
                'code' => '3AS_ELECTRICAL',
                'year_level' => '3AS',
                'sort_order' => 1,
            ],
            [
                'name' => 'هندسة مدنية',
                'name_en' => 'Civil Engineering',
                'code' => '3AS_CIVIL',
                'year_level' => '3AS',
                'sort_order' => 2,
            ],
            [
                'name' => 'هندسة ميكانيكية',
                'name_en' => 'Mechanical Engineering',
                'code' => '3AS_MECHANICAL',
                'year_level' => '3AS',
                'sort_order' => 3,
            ],
            [
                'name' => 'هندسة الطرائق',
                'name_en' => 'Process Engineering',
                'code' => '3AS_PROCESS',
                'year_level' => '3AS',
                'sort_order' => 4,
            ],
        ];

        foreach ($branches as $branchData) {
            Branch::updateOrCreate(
                ['code' => $branchData['code']],
                $branchData
            );
        }
    }
}
