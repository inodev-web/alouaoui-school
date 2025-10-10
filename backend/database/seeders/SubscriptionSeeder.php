<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use Carbon\Carbon;

class SubscriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = User::where('role', 'student')->get();
        $teachers = Teacher::all();
        
        if ($students->isEmpty() || $teachers->isEmpty()) {
            $this->command->warn('No students or teachers found. Please run other seeders first.');
            return;
        }

        $today = Carbon::today();
        
        // Create active subscriptions for today
        foreach ($students->take(10) as $student) {
            $teacher = $teachers->random();
            
            // Create monthly subscription starting today
            Subscription::create([
                'user_uuid' => $student->uuid,
                'teacher_uuid' => $teacher->uuid,
                'starts_at' => $today,
                'ends_at' => $today->copy()->addMonth(),
            ]);
            
            // Create another subscription ending today (expiring)
            if ($students->count() > 5) {
                $anotherTeacher = $teachers->where('uuid', '!=', $teacher->uuid)->random();
                Subscription::create([
                    'user_uuid' => $student->uuid,
                    'teacher_uuid' => $anotherTeacher->uuid,
                    'starts_at' => $today->copy()->subMonth(),
                    'ends_at' => $today,
                ]);
            }
        }
        
        // Create some subscriptions that started recently and are still active
        foreach ($students->skip(10)->take(5) as $student) {
            $teacher = $teachers->random();
            
            Subscription::create([
                'user_uuid' => $student->uuid,
                'teacher_uuid' => $teacher->uuid,
                'starts_at' => $today->copy()->subDays(rand(1, 15)),
                'ends_at' => $today->copy()->addDays(rand(15, 45)),
            ]);
        }

        $this->command->info('Created subscriptions with today\'s date and recent dates');
    }
}
