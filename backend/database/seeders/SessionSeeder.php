<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;

class SessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teachers = Teacher::all();
        $students = User::where('role', 'student')->get();
        
        if ($teachers->isEmpty()) {
            $this->command->warn('No teachers found. Please run TeacherSeeder first.');
            return;
        }

        $today = Carbon::today();
        $years = User::YEARS_OF_STUDY;
        
        // Create sessions for today
        foreach ($teachers as $teacher) {
            // Morning session (8:00 - 10:00)
            $morningSession = Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $today->copy()->setHour(8)->setMinute(0),
                'end_time' => $today->copy()->setHour(10)->setMinute(0),
                'status' => 'scheduled',
            ]);
            
            // Afternoon session (14:00 - 16:00)
            $afternoonSession = Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $today->copy()->setHour(14)->setMinute(0),
                'end_time' => $today->copy()->setHour(16)->setMinute(0),
                'status' => 'scheduled',
            ]);
            
            // Evening session (18:00 - 20:00)
            $eveningSession = Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $today->copy()->setHour(18)->setMinute(0),
                'end_time' => $today->copy()->setHour(20)->setMinute(0),
                'status' => 'scheduled',
            ]);
            
            // Create some completed sessions from earlier today
            $completedSession = Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $today->copy()->setHour(6)->setMinute(0),
                'end_time' => $today->copy()->setHour(8)->setMinute(0),
                'status' => 'completed',
            ]);
            
            // Add attendance for completed session
            if (!$students->isEmpty()) {
                $attendingStudents = $students->random(rand(3, min(8, $students->count())));
                foreach ($attendingStudents as $student) {
                    Attendance::create([
                        'student_uuid' => $student->uuid,
                        'teacher_uuid' => $teacher->uuid,
                        'session_id' => $completedSession->id,
                        'validated_at' => $completedSession->start_time->addMinutes(rand(0, 30)),
                    ]);
                }
            }
        }
        
        // Create sessions for yesterday (completed)
        $yesterday = $today->copy()->subDay();
        foreach ($teachers->take(3) as $teacher) {
            $yesterdaySession = Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $yesterday->copy()->setHour(10)->setMinute(0),
                'end_time' => $yesterday->copy()->setHour(12)->setMinute(0),
                'status' => 'completed',
            ]);
            
            // Add attendance for yesterday's session
            if (!$students->isEmpty()) {
                $attendingStudents = $students->random(rand(2, min(6, $students->count())));
                foreach ($attendingStudents as $student) {
                    Attendance::create([
                        'student_uuid' => $student->uuid,
                        'teacher_uuid' => $teacher->uuid,
                        'session_id' => $yesterdaySession->id,
                        'validated_at' => $yesterdaySession->start_time->addMinutes(rand(0, 30)),
                    ]);
                }
            }
        }
        
        // Create sessions for tomorrow (scheduled)
        $tomorrow = $today->copy()->addDay();
        foreach ($teachers->take(2) as $teacher) {
            Session::create([
                'teacher_uuid' => $teacher->uuid,
                'year_target' => $years[array_rand($years)],
                'start_time' => $tomorrow->copy()->setHour(9)->setMinute(0),
                'end_time' => $tomorrow->copy()->setHour(11)->setMinute(0),
                'status' => 'scheduled',
            ]);
        }

        $this->command->info('Created sessions for today, yesterday, and tomorrow with attendance records');
    }
}
