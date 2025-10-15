<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Models\Branch;

echo "🌱 Seeding check-in test data...\n\n";

// Ensure we have at least one branch
$branch = Branch::firstOrCreate(
    ['code' => 'SM'],
    [
        'name' => 'العلوم الرياضية',
        'year_level' => '1BAC',
    ]
);
echo "✓ Branch created/found: {$branch->name}\n";

// Create admin user if not exists
$admin = User::firstOrCreate(
    ['phone' => '0555000000'],
    [
        'firstname' => 'Admin',
        'lastname' => 'System',
        'password' => bcrypt('admin123'),
        'role' => 'admin',
        'year_of_study' => '1BAC',
        'branch_id' => $branch->id,
    ]
);
echo "✓ Admin user created/found: {$admin->firstname} {$admin->lastname}\n";

// Create some teachers if they don't exist
$teachers = [];
for ($i = 1; $i <= 3; $i++) {
    $teacher = Teacher::firstOrCreate(
        ['name' => "الأستاذ $i"],
        [
            'module' => "مادة $i",
            'price_subscription' => 1500 + ($i * 100),
            'price_session' => 150 + ($i * 10),
        ]
    );
    $teachers[] = $teacher;
    echo "✓ Teacher created/found: {$teacher->name}\n";
}

// Create some students if they don't exist
$students = [];
for ($i = 1; $i <= 5; $i++) {
    $student = User::firstOrCreate(
        ['phone' => '055512345' . $i],
        [
            'firstname' => "طالب",
            'lastname' => "رقم $i",
            'password' => bcrypt('123456789'),
            'role' => 'student',
            'year_of_study' => '1BAC',
            'branch_id' => $branch->id,
            'free_subscriber' => $i === 1, // First student is free subscriber
        ]
    );
    $students[] = $student;
    echo "✓ Student created/found: {$student->firstname} {$student->lastname} (UUID: {$student->uuid})\n";
}

echo "\n";

// Create today's sessions
$today = now();
$sessions = [];

foreach ($teachers as $index => $teacher) {
    $startTime = $today->copy()->setHour(9 + ($index * 2))->setMinute(0)->setSecond(0);
    $endTime = $startTime->copy()->addHours(2);
    
    $session = Session::firstOrCreate(
        [
            'teacher_uuid' => $teacher->uuid,
            'start_time' => $startTime,
        ],
        [
            'end_time' => $endTime,
            'status' => null, // NULL status = available for check-in
            'year_target' => '1BAC',
            'branch_id' => $branch->id,
        ]
    );
    
    $sessions[] = $session;
    echo "✓ Session created/found: {$teacher->name} at {$startTime->format('H:i')} - {$endTime->format('H:i')}\n";
}

echo "\n";

// Create some attendance records for today
$attendanceCount = 0;
foreach ($students as $studentIndex => $student) {
    // Each student attends 1-2 random sessions
    $sessionCount = rand(1, 2);
    $attendedSessions = array_rand($sessions, $sessionCount);
    
    if (!is_array($attendedSessions)) {
        $attendedSessions = [$attendedSessions];
    }
    
    foreach ($attendedSessions as $sessionIndex) {
        $session = $sessions[$sessionIndex];
        
        Attendance::firstOrCreate(
            [
                'student_uuid' => $student->uuid,
                'session_id' => $session->id,
            ],
            [
                'teacher_uuid' => $session->teacher_uuid,
                'validated_at' => now(),
                'created_at' => now(),
            ]
        );
        
        $attendanceCount++;
        echo "✓ Attendance created: {$student->firstname} {$student->lastname} → {$session->teacher->name}\n";
    }
}

echo "\n";
echo "════════════════════════════════════════════════\n";
echo "✅ Seeding complete!\n";
echo "════════════════════════════════════════════════\n";
echo "📊 Summary:\n";
echo "   - Teachers: " . count($teachers) . "\n";
echo "   - Students: " . count($students) . "\n";
echo "   - Today's Sessions: " . count($sessions) . "\n";
echo "   - Attendance Records: {$attendanceCount}\n";
echo "════════════════════════════════════════════════\n";
echo "\n";
echo "🔑 Test Credentials:\n";
echo "   Admin: 0555000000 / admin123\n";
echo "   Student 1 (Free): 0555123451 / 123456789\n";
echo "   Student 2: 0555123452 / 123456789\n";
echo "════════════════════════════════════════════════\n";
