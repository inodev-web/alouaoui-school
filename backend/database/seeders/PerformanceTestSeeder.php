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

        // 1. Generate 500 Students (test avec moins de données d'abord)
        $this->command->info("\n📝 Generating 500 students...");
        $this->generateStudents(500, $branches, $faker);

        // 2. Generate 100 Sessions
        $this->command->info("\n📅 Generating 100 sessions...");
        $this->generateSessions(100, $teachers, $branches);

        // 3. Generate 500 Subscriptions
        $this->command->info("\n💳 Generating 500 subscriptions...");
        $this->generateSubscriptions(500, $teachers);

        // 4. Generate 1000 Attendances
        $this->command->info("\n✅ Generating 1000 attendances...");
        $this->generateAttendances(1000);

        // Re-enable foreign key checks
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }

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

        // Hash password once for performance (all test users share same password)
        $hashedPassword = Hash::make('password123');

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
                    'password' => $hashedPassword,
                    'role' => 'student',
                    'year_of_study' => $year,
                    'branch_id' => $branchId,
                    'qr_token' => Str::uuid(),
                    'free_subscriber' => $faker->boolean(10), // 10% free
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }            DB::table('users')->insert($students);
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
        $batchSize = 500;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $subscriptions = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $startDate = Carbon::now()->subDays(rand(0, 90));

                $subscriptions[] = [
                    'user_uuid' => $students[array_rand($students)],
                    'teacher_uuid' => $teachers[array_rand($teachers)],
                    'starts_at' => $startDate,
                    'ends_at' => (clone $startDate)->addMonths(rand(1, 12)),
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
        $teachers = DB::table('teachers')->pluck('uuid')->toArray();
        $batchSize = 500;
        $batches = ceil($count / $batchSize);

        $this->command->getOutput()->progressStart($batches);

        for ($b = 0; $b < $batches; $b++) {
            $attendances = [];
            $currentBatchSize = min($batchSize, $count - ($b * $batchSize));

            for ($i = 0; $i < $currentBatchSize; $i++) {
                $attendances[] = [
                    'session_id' => $sessions[array_rand($sessions)],
                    'student_uuid' => $students[array_rand($students)],
                    'teacher_uuid' => $teachers[array_rand($teachers)],
                    'validated_at' => rand(0, 1) ? Carbon::now()->subDays(rand(0, 60))->addHours(rand(8, 20)) : null,
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
