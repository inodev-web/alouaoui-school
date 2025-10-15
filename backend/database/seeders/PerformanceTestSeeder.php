<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Faker\Factory as Faker;

class PerformanceTestSeeder extends Seeder
{
    /**
     * Seed the database with performance test data
     * Creates 3000+ students, sessions, subscriptions for load testing
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting performance test data generation...');

        // Initialize Faker
        $faker = Faker::create();

        // Disable foreign key checks for faster inserts (SQLite compatible)
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        // Get existing branches and teachers
        $branches = DB::table('branches')->pluck('id')->toArray();
        $teachers = DB::table('teachers')->pluck('uuid')->toArray();

        if (empty($branches) || empty($teachers)) {
            $this->command->error('❌ Please seed branches and teachers first!');
            return;
        }

        $this->command->info('📚 Branches available: ' . count($branches));
        $this->command->info('👨‍🏫 Teachers available: ' . count($teachers));

        // 1. Generate 3000 Students
        $this->command->info("\n📝 Generating 3000 students...");
        $this->generateStudents(3000, $branches, $faker);

        // 2. Generate 500 Sessions
        $this->command->info("\n📅 Generating 500 sessions...");
        $this->generateSessions(500, $teachers, $branches);

        // 3. Generate 5000 Subscriptions
        $this->command->info("\n💳 Generating 5000 subscriptions...");
        $this->generateSubscriptions(5000, $teachers);

        // 4. Generate 10000 Attendances
        $this->command->info("\n✅ Generating 10000 attendances...");
        $this->generateAttendances(10000);

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info("\n🎉 Performance test data generation completed!");
        $this->command->info("📊 Database is ready for load testing with 3000+ users");
    }

    /**
     * Generate students
     */
    private function generateStudents(int $count, array $branches, $faker): void
    {
        $years = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];
        $highSchoolYears = ['1AS', '2AS', '3AS'];
        $batchSize = 500;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $students = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $year = $years[array_rand($years)];
                $branchId = in_array($year, $highSchoolYears) ? $branches[array_rand($branches)] : null;

                $students[] = [
                    'uuid' => Str::uuid(),
                    'firstname' => 'Test-' . $faker->firstName(),
                    'lastname' => 'User-' . $faker->lastName(),
                    'phone' => '0' . rand(500000000, 799999999),
                    'password' => Hash::make('password123'),
                    'role' => 'student',
                    'year_of_study' => $year,
                    'branch_id' => $branchId,
                    'qr_token' => Str::uuid(),
                    'free_subscriber' => $faker->boolean(10), // 10% free
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('users')->insert($students);
            $this->command->getOutput()->progressAdvance();
        }

        $this->command->getOutput()->progressFinish();
        $this->command->info("✅ Created $count students");
    }

    /**
     * Generate sessions
     */
    private function generateSessions(int $count, array $teachers, array $branches): void
    {
        $years = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];
        $statuses = [null, 'completed', 'cancelled'];
        $batchSize = 100;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $sessions = [];
            $sessionBranches = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $startTime = Carbon::now()->subDays(rand(0, 60))->addHours(rand(8, 20));
                $duration = [1, 1.5, 2, 2.5, 3][array_rand([1, 1.5, 2, 2.5, 3])];
                $endTime = (clone $startTime)->addHours($duration);
                $year = $years[array_rand($years)];
                $status = $statuses[array_rand($statuses)];

                $sessionId = DB::table('sessions')->insertGetId([
                    'teacher_uuid' => $teachers[array_rand($teachers)],
                    'year_target' => $year,
                    'branch_id' => $branches[array_rand($branches)],
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'status' => $status,
                    'cancel_reason' => $status === 'cancelled' ? 'Test cancellation reason' : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Add to session_branch pivot (multi-branch sessions)
                if (rand(0, 100) > 70) { // 30% chance of multi-branch
                    $numBranches = rand(2, 3);
                    $selectedBranches = array_rand(array_flip($branches), $numBranches);
                    foreach ((array)$selectedBranches as $branchId) {
                        $sessionBranches[] = [
                            'session_id' => $sessionId,
                            'branch_id' => $branchId,
                        ];
                    }
                }
            }

            if (!empty($sessionBranches)) {
                DB::table('session_branch')->insert($sessionBranches);
            }

            $this->command->getOutput()->progressAdvance();
        }

        $this->command->getOutput()->progressFinish();
        $this->command->info("✅ Created $count sessions");
    }

    /**
     * Generate subscriptions
     */
    private function generateSubscriptions(int $count, array $teachers): void
    {
        $students = DB::table('users')->where('role', 'student')->pluck('uuid')->toArray();
        $statuses = ['active', 'expired', 'cancelled'];
        $batchSize = 500;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $subscriptions = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $startDate = Carbon::now()->subDays(rand(0, 90));

                $subscriptions[] = [
                    'uuid' => Str::uuid(),
                    'student_uuid' => $students[array_rand($students)],
                    'teacher_uuid' => $teachers[array_rand($teachers)],
                    'amount' => rand(500, 3000),
                    'months' => rand(1, 12),
                    'start_date' => $startDate,
                    'end_date' => (clone $startDate)->addMonths(rand(1, 12)),
                    'status' => $statuses[array_rand($statuses)],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('subscriptions')->insert($subscriptions);
            $this->command->getOutput()->progressAdvance();
        }

        $this->command->getOutput()->progressFinish();
        $this->command->info("✅ Created $count subscriptions");
    }

    /**
     * Generate attendances
     */
    private function generateAttendances(int $count): void
    {
        $sessions = DB::table('sessions')->pluck('id')->toArray();
        $students = DB::table('users')->where('role', 'student')->pluck('uuid')->toArray();
        $batchSize = 500;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $attendances = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $checkInTime = Carbon::now()->subDays(rand(0, 60))->addHours(rand(8, 20));

                $attendances[] = [
                    'uuid' => Str::uuid(),
                    'session_id' => $sessions[array_rand($sessions)],
                    'student_uuid' => $students[array_rand($students)],
                    'check_in_time' => $checkInTime,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('attendances')->insert($attendances);
            $this->command->getOutput()->progressAdvance();
        }

        $this->command->getOutput()->progressFinish();
        $this->command->info("✅ Created $count attendances");

        // Re-enable foreign key checks
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }

        $this->command->info('🎉 Performance test data generation complete!');
    }
}
