<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Attendance;
use App\Models\Session;
use Illuminate\Support\Str;
use Carbon\Carbon;

class StudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer des professeurs de test d'abord si ils n'existent pas
        $teachers = [];
        
        if (Teacher::count() === 0) {
            $teachersData = [
                ['name' => 'إسماعيل علواوي', 'module' => 'الرياضيات', 'uuid' => Teacher::ALOUAOUI_UUID],
                ['name' => 'د. سارة أحمد', 'module' => 'الفيزياء'],
                ['name' => 'أ. محمد علي', 'module' => 'الكيمياء'],
                ['name' => 'أ.د. فاطمة زهراء', 'module' => 'الأحياء'],
                ['name' => 'د. يوسف حسن', 'module' => 'اللغة العربية'],
            ];

            foreach ($teachersData as $teacherData) {
                $teacher = Teacher::create([
                    'uuid' => $teacherData['uuid'] ?? Str::uuid(),
                    'name' => $teacherData['name'],
                    'module' => $teacherData['module'],
                    'phone' => '0' . rand(600000000, 799999999),
                    'is_online_publisher' => rand(0, 1),
                    'price_subscription' => rand(1000, 5000),
                    'price_session' => rand(100, 500),
                    'percent_school' => rand(10, 30),
                ]);
                $teachers[] = $teacher;
            }
        } else {
            $teachers = Teacher::all()->toArray();
        }

        // Créer des étudiants de test
        $students = [];
        $firstNames = ['أحمد', 'محمد', 'فاطمة', 'عائشة', 'علي', 'حسن', 'زينب', 'خديجة', 'عبد الله', 'إبراهيم', 'مريم', 'سارة'];
        $lastNames = ['الأحمد', 'المحمد', 'العلي', 'الحسن', 'الزهراء', 'التميمي', 'القرشي', 'الهاشمي', 'العباسي', 'الأموي'];
        $years = User::YEARS_OF_STUDY;

        for ($i = 0; $i < 20; $i++) {
            $student = User::create([
                'uuid' => Str::uuid(),
                'firstname' => $firstNames[array_rand($firstNames)],
                'lastname' => $lastNames[array_rand($lastNames)],
                'phone' => '0' . rand(500000000, 799999999),
                'password' => bcrypt('password123'),
                'birth_date' => Carbon::now()->subYears(rand(14, 20))->subDays(rand(0, 365)),
                'address' => 'عنوان تجريبي ' . ($i + 1),
                'school_name' => 'مدرسة ' . ['الشهداء', 'النور', 'العلم', 'المستقبل', 'الأمل'][array_rand(['الشهداء', 'النور', 'العلم', 'المستقبل', 'الأمل'])],
                'year_of_study' => $years[array_rand($years)],
                'role' => 'student',
                'device_uuid' => Str::uuid(),
                'free_subscriber' => rand(0, 10) === 0, // 10% chance d'être gratuit
                'free_subscriber_reason' => rand(0, 10) === 0 ? 'طالب متفوق' : null,
            ]);
            $students[] = $student;
        }

        // Créer des abonnements pour certains étudiants
        foreach ($students as $index => $student) {
            if ($index < 15) { // 15 étudiants avec abonnements
                $teacher = $teachers[array_rand($teachers)];
                $startDate = Carbon::now()->subDays(rand(30, 90));
                $endDate = $startDate->copy()->addDays(rand(30, 60));
                
                Subscription::create([
                    'user_uuid' => $student->uuid,
                    'teacher_uuid' => $teacher['uuid'],
                    'starts_at' => $startDate,
                    'ends_at' => $endDate,
                ]);
            }
        }

        // Créer des sessions de test
        $sessions = [];
        foreach ($teachers as $teacher) {
            for ($j = 0; $j < 5; $j++) {
                $session = Session::create([
                    'teacher_uuid' => $teacher['uuid'],
                    'year_target' => $years[array_rand($years)],
                    'start_time' => Carbon::now()->subDays(rand(1, 30))->setHour(rand(8, 18)),
                    'end_time' => Carbon::now()->subDays(rand(1, 30))->setHour(rand(8, 18))->addHours(2),
                    'status' => 'completed',
                ]);
                $sessions[] = $session;
            }
        }

        // Créer des présences pour certains étudiants
        foreach ($students as $index => $student) {
            if ($index < 12) { // 12 étudiants avec présences
                $numAttendances = rand(1, 15);
                for ($k = 0; $k < $numAttendances; $k++) {
                    $session = $sessions[array_rand($sessions)];
                    $teacher = $teachers[array_rand($teachers)];
                    
                    // Éviter les doublons
                    $existingAttendance = Attendance::where('student_uuid', $student->uuid)
                        ->where('session_id', $session->id)
                        ->first();
                        
                    if (!$existingAttendance) {
                        Attendance::create([
                            'student_uuid' => $student->uuid,
                            'teacher_uuid' => $teacher['uuid'],
                            'session_id' => $session->id,
                            'validated_at' => Carbon::now()->subDays(rand(1, 30)),
                        ]);
                    }
                }
            }
        }

        $this->command->info('Created ' . count($students) . ' test students with related data');
    }
}
