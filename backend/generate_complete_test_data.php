<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Support\Str;
use Carbon\Carbon;

// Configuration de la base de données
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/database/database.sqlite',
    'prefix' => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// Script pour générer des données de test complètes
echo "🚀 Génération des données de test complètes pour le dashboard...\n\n";

// 1. Vider les tables pour un test propre
echo "1️⃣ Nettoyage des tables existantes...\n";
Capsule::table('stream_tokens')->truncate();
Capsule::table('attendances')->truncate();
Capsule::table('payments')->truncate();
Capsule::table('subscriptions')->truncate();
Capsule::table('sessions')->truncate();
Capsule::table('courses')->truncate();
Capsule::table('chapters')->truncate();
Capsule::table('users')->where('role', '!=', 'admin')->delete();
Capsule::table('teachers')->truncate();

// 2. Créer les enseignants
echo "2️⃣ Création des enseignants...\n";
$teachers = [
    [
        'uuid' => Str::uuid(),
        'name' => 'أستاذ العلوائي',
        'phone' => '0555123456',
        'module' => 'رياضيات',
        'is_online_publisher' => true,
        'price_subscription' => 3000.00,
        'price_session' => 1500.00,
        'percent_school' => 70,
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ],
    [
        'uuid' => Str::uuid(),
        'name' => 'أستاذة سارة بن علي',
        'phone' => '0666789012',
        'module' => 'فيزياء',
        'is_online_publisher' => true,
        'price_subscription' => 2800.00,
        'price_session' => 1400.00,
        'percent_school' => 65,
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ],
    [
        'uuid' => Str::uuid(),
        'name' => 'أستاذ محمد بوعلام',
        'phone' => '0777345678',
        'module' => 'علوم طبيعية',
        'is_online_publisher' => false,
        'price_subscription' => 2500.00,
        'price_session' => 1200.00,
        'percent_school' => 60,
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ],
    [
        'uuid' => Str::uuid(),
        'name' => 'أستاذة فاطمة زهراء',
        'phone' => '0555987654',
        'module' => 'لغة عربية',
        'is_online_publisher' => true,
        'price_subscription' => 2200.00,
        'price_session' => 1100.00,
        'percent_school' => 55,
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ],
    [
        'uuid' => Str::uuid(),
        'name' => 'أستاذ كريم حداد',
        'phone' => '0666123789',
        'module' => 'لغة فرنسية',
        'is_online_publisher' => true,
        'price_subscription' => 2400.00,
        'price_session' => 1300.00,
        'percent_school' => 65,
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]
];

foreach ($teachers as $teacher) {
    Capsule::table('teachers')->insert($teacher);
}
echo "   ✅ " . count($teachers) . " enseignants créés\n";

// 3. Créer les étudiants
echo "3️⃣ Création des étudiants...\n";
$students = [];
$year_levels = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];
$schools = ['متوسطة الأندلس', 'متوسطة ابن خلدون', 'ثانوية الفارابي', 'ثانوية ابن سينا', 'متوسطة الزهراء'];

for ($i = 1; $i <= 85; $i++) {
    $uuid = Str::uuid();
    $year = $year_levels[array_rand($year_levels)];
    $school = $schools[array_rand($schools)];
    
    // Dates de création variées (6 derniers mois)
    $createdDate = Carbon::now()->subDays(rand(1, 180));
    
    $students[] = [
        'uuid' => $uuid,
        'firstname' => 'طالب' . $i,
        'lastname' => 'العلوائي',
        'birth_date' => Carbon::now()->subYears(rand(12, 18))->format('Y-m-d'),
        'address' => 'حي النور، الجزائر العاصمة',
        'school_name' => $school,
        'phone' => '055' . str_pad($i, 7, '0', STR_PAD_LEFT),
        'password' => password_hash('123456789', PASSWORD_DEFAULT),
        'year_of_study' => $year,
        'role' => 'student',
        'device_uuid' => Str::uuid(),
        'qr_token' => Str::random(32),
        'free_subscriber' => rand(1, 100) <= 15, // 15% gratuits
        'free_subscriber_reason' => rand(1, 100) <= 15 ? 'أسرة محتاجة' : null,
        'created_at' => $createdDate,
        'updated_at' => $createdDate,
    ];
}

foreach (array_chunk($students, 20) as $chunk) {
    Capsule::table('users')->insert($chunk);
}
echo "   ✅ " . count($students) . " étudiants créés\n";

// 4. Créer les chapitres
echo "4️⃣ Création des chapitres et cours...\n";
$chapters_data = [
    ['title' => 'الجبر الأساسي', 'year_target' => '1AM', 'courses' => ['المعادلات البسيطة', 'حل المسائل', 'التطبيقات العملية']],
    ['title' => 'الهندسة المستوية', 'year_target' => '2AM', 'courses' => ['المثلثات', 'الدوائر', 'المساحات']],
    ['title' => 'التحليل الرياضي', 'year_target' => '1AS', 'courses' => ['النهايات', 'المشتقات', 'التكاملات']],
    ['title' => 'الميكانيك', 'year_target' => '2AS', 'courses' => ['قوانين نيوتن', 'الحركة', 'الطاقة']],
    ['title' => 'الكيمياء العضوية', 'year_target' => '3AS', 'courses' => ['الألكانات', 'التفاعلات', 'التطبيقات']],
    ['title' => 'النحو والصرف', 'year_target' => '3AM', 'courses' => ['الأفعال', 'الأسماء', 'الجمل']],
    ['title' => 'الأدب العربي', 'year_target' => '1AS', 'courses' => ['الشعر الجاهلي', 'النثر', 'البلاغة']],
    ['title' => 'La grammaire française', 'year_target' => '2AM', 'courses' => ['Les temps', 'Les pronoms', 'La syntaxe']],
];

$chapter_ids = [];
foreach ($chapters_data as $chapter_data) {
    $chapter_id = Capsule::table('chapters')->insertGetId([
        'title' => $chapter_data['title'],
        'description' => 'وصف تفصيلي للفصل',
        'year_target' => $chapter_data['year_target'],
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    
    $chapter_ids[] = $chapter_id;
    
    // Créer les cours pour chaque chapitre
    foreach ($chapter_data['courses'] as $course_title) {
        Capsule::table('courses')->insert([
            'chapter_id' => $chapter_id,
            'title' => $course_title,
            'description' => 'درس مفصل حول ' . $course_title,
            'duration' => rand(45, 120),
            'video_ref' => 'video_' . Str::random(10),
            'pdf_summary' => 'summary_' . Str::random(10) . '.pdf',
            'exercises_pdf' => 'exercises_' . Str::random(10) . '.pdf',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
echo "   ✅ " . count($chapters_data) . " chapitres et " . (count($chapters_data) * 3) . " cours créés\n";

// 5. Créer les abonnements
echo "5️⃣ Création des abonnements...\n";
$subscriptions = [];
$student_uuids = array_column($students, 'uuid');
$teacher_uuids = array_column($teachers, 'uuid');

foreach ($student_uuids as $student_uuid) {
    // Chaque étudiant a 1-3 abonnements
    $num_subscriptions = rand(1, 3);
    $used_teachers = [];
    
    for ($j = 0; $j < $num_subscriptions; $j++) {
        // Éviter les doublons d'enseignants pour le même étudiant
        $available_teachers = array_diff($teacher_uuids, $used_teachers);
        if (empty($available_teachers)) break;
        
        $teacher_uuid = $available_teachers[array_rand($available_teachers)];
        $used_teachers[] = $teacher_uuid;
        
        // Dates variées pour les abonnements
        $start_date = Carbon::now()->subDays(rand(30, 180));
        $end_date = $start_date->copy()->addMonths(rand(1, 6));
        
        $subscriptions[] = [
            'user_uuid' => $student_uuid,
            'teacher_uuid' => $teacher_uuid,
            'starts_at' => $start_date,
            'ends_at' => $end_date,
            'created_at' => $start_date,
            'updated_at' => $start_date,
        ];
    }
}

foreach (array_chunk($subscriptions, 50) as $chunk) {
    Capsule::table('subscriptions')->insert($chunk);
}
echo "   ✅ " . count($subscriptions) . " abonnements créés\n";

// 6. Créer les sessions
echo "6️⃣ Création des sessions...\n";
$sessions = [];
$session_statuses = ['completed', 'cancelled'];

for ($i = 0; $i < 150; $i++) {
    $teacher_uuid = $teacher_uuids[array_rand($teacher_uuids)];
    $year_target = $year_levels[array_rand($year_levels)];
    
    // Sessions étalées sur les 6 derniers mois
    $start_time = Carbon::now()->subDays(rand(1, 180))
        ->setHour(rand(8, 18))
        ->setMinute(rand(0, 1) * 30)
        ->setSecond(0);
    
    $end_time = $start_time->copy()->addMinutes(rand(60, 120));
    $status = $session_statuses[array_rand($session_statuses)];
    
    $sessions[] = [
        'teacher_uuid' => $teacher_uuid,
        'year_target' => $year_target,
        'start_time' => $start_time,
        'end_time' => $end_time,
        'status' => $status,
        'created_at' => $start_time,
        'updated_at' => $start_time,
    ];
}

foreach (array_chunk($sessions, 30) as $chunk) {
    Capsule::table('sessions')->insert($chunk);
}
echo "   ✅ " . count($sessions) . " sessions créées\n";

// Récupérer les IDs des sessions créées
$session_ids = Capsule::table('sessions')->pluck('id')->toArray();

// 7. Créer les présences
echo "7️⃣ Création des présences...\n";
$attendances = [];

foreach ($session_ids as $session_id) {
    $session = Capsule::table('sessions')->where('id', $session_id)->first();
    
    // Seulement pour les sessions complétées
    if ($session->status === 'completed') {
        // Nombre d'étudiants présents (entre 5 et 25)
        $num_attendees = rand(5, min(25, count($student_uuids)));
        $shuffled_students = $student_uuids;
        shuffle($shuffled_students);
        $selected_students = array_slice($shuffled_students, 0, $num_attendees);
        
        foreach ($selected_students as $student_uuid) {
            // 80% des présences sont validées
            $is_validated = rand(1, 100) <= 80;
            
            $attendances[] = [
                'student_uuid' => $student_uuid,
                'teacher_uuid' => $session->teacher_uuid,
                'session_id' => $session_id,
                'validated_at' => $is_validated ? Carbon::parse($session->start_time)->addMinutes(rand(10, 60)) : null,
                'created_at' => $session->start_time,
                'updated_at' => $session->start_time,
            ];
        }
    }
}

foreach (array_chunk($attendances, 50) as $chunk) {
    Capsule::table('attendances')->insert($chunk);
}
echo "   ✅ " . count($attendances) . " présences créées\n";

// 8. Créer les paiements
echo "8️⃣ Création des paiements...\n";
$payments = [];
$payment_contexts = ['subscription', 'session', 'school_entry'];
$payment_methods = ['cash', 'online'];
$payment_statuses = ['pending', 'confirmed', 'failed'];

// Répartition des paiements sur 6 mois
for ($month = 5; $month >= 0; $month--) {
    $month_date = Carbon::now()->subMonths($month);
    $payments_this_month = rand(15, 35); // Nombre de paiements par mois
    
    for ($i = 0; $i < $payments_this_month; $i++) {
        $student_uuid = $student_uuids[array_rand($student_uuids)];
        $teacher_uuid = $teacher_uuids[array_rand($teacher_uuids)];
        
        $context = $payment_contexts[array_rand($payment_contexts)];
        $method = $payment_methods[array_rand($payment_methods)];
        
        // Statuts réalistes : plus de confirmés, quelques en attente, peu d'échecs
        $status_weights = ['confirmed' => 70, 'pending' => 20, 'failed' => 10];
        $rand = rand(1, 100);
        if ($rand <= 70) {
            $status = 'confirmed';
        } elseif ($rand <= 90) {
            $status = 'pending';
        } else {
            $status = 'failed';
        }
        
        // Montants selon le contexte
        switch ($context) {
            case 'subscription':
                $amount = rand(2000, 3500);
                break;
            case 'session':
                $amount = rand(1000, 1800);
                break;
            case 'school_entry':
                $amount = rand(500, 1200);
                break;
        }
        
        // Date de création dans le mois
        $payment_date = $month_date->copy()->addDays(rand(1, $month_date->daysInMonth));
        
        $payments[] = [
            'student_uuid' => $student_uuid,
            'teacher_uuid' => $teacher_uuid,
            'amount' => $amount,
            'method' => $method,
            'status' => $status,
            'payment_context' => $context,
            'grants_school_entry' => $context === 'school_entry' && $status === 'confirmed',
            'processor_reference' => $method === 'online' ? 'TXN_' . Str::random(12) : null,
            'created_at' => $payment_date,
            'updated_at' => $payment_date,
        ];
    }
}

foreach (array_chunk($payments, 30) as $chunk) {
    Capsule::table('payments')->insert($chunk);
}
echo "   ✅ " . count($payments) . " paiements créés\n";

// 9. Créer des tokens de streaming
echo "9️⃣ Création des tokens de streaming...\n";
$stream_tokens = [];
$course_ids = Capsule::table('courses')->pluck('id')->toArray();

for ($i = 0; $i < 200; $i++) {
    $student_uuid = $student_uuids[array_rand($student_uuids)];
    $course_id = $course_ids[array_rand($course_ids)];
    
    $created_date = Carbon::now()->subDays(rand(1, 60));
    $expires_at = $created_date->copy()->addHours(2);
    
    // 60% des tokens sont utilisés
    $is_used = rand(1, 100) <= 60;
    $accessed_at = $is_used ? $created_date->copy()->addMinutes(rand(5, 90)) : null;
    
    $stream_tokens[] = [
        'user_uuid' => $student_uuid,
        'course_id' => $course_id,
        'token' => Str::random(64),
        'ip_address' => '192.168.1.' . rand(1, 254),
        'user_agent' => 'Mozilla/5.0 (Mobile App)',
        'expires_at' => $expires_at,
        'accessed_at' => $accessed_at,
        'is_used' => $is_used,
        'metadata' => json_encode([
            'device_type' => rand(1, 100) <= 70 ? 'mobile' : 'desktop',
            'app_version' => '1.2.' . rand(1, 5),
            'location' => 'Algiers',
        ]),
        'created_at' => $created_date,
        'updated_at' => $accessed_at ?: $created_date,
    ];
}

foreach (array_chunk($stream_tokens, 50) as $chunk) {
    Capsule::table('stream_tokens')->insert($chunk);
}
echo "   ✅ " . count($stream_tokens) . " tokens de streaming créés\n";

// 10. Statistiques finales
echo "\n📊 RÉSUMÉ DES DONNÉES GÉNÉRÉES:\n";
echo "=" . str_repeat("=", 50) . "\n";

$total_students = Capsule::table('users')->where('role', 'student')->count();
$total_teachers = Capsule::table('teachers')->count();
$total_subscriptions = Capsule::table('subscriptions')->count();
$total_sessions = Capsule::table('sessions')->count();
$total_attendances = Capsule::table('attendances')->count();
$total_payments = Capsule::table('payments')->count();
$total_courses = Capsule::table('courses')->count();
$total_chapters = Capsule::table('chapters')->count();
$total_tokens = Capsule::table('stream_tokens')->count();

echo "👥 Étudiants: $total_students\n";
echo "👨‍🏫 Enseignants: $total_teachers\n";
echo "📚 Chapitres: $total_chapters\n";
echo "🎥 Cours: $total_courses\n";
echo "💳 Abonnements: $total_subscriptions\n";
echo "🏫 Sessions: $total_sessions\n";
echo "✅ Présences: $total_attendances\n";
echo "💰 Paiements: $total_payments\n";
echo "🎬 Tokens streaming: $total_tokens\n";

// Statistiques de revenus
$monthly_revenue = Capsule::table('payments')
    ->where('status', 'confirmed')
    ->whereMonth('created_at', Carbon::now()->month)
    ->whereYear('created_at', Carbon::now()->year)
    ->sum('amount');

$total_revenue = Capsule::table('payments')
    ->where('status', 'confirmed')
    ->sum('amount');

$confirmed_payments = Capsule::table('payments')->where('status', 'confirmed')->count();
$pending_payments = Capsule::table('payments')->where('status', 'pending')->count();
$failed_payments = Capsule::table('payments')->where('status', 'failed')->count();

echo "\n💰 ANALYSE DES REVENUS:\n";
echo "-" . str_repeat("-", 30) . "\n";
echo "💵 Revenus ce mois: " . number_format($monthly_revenue, 2) . " DZD\n";
echo "💵 Revenus total: " . number_format($total_revenue, 2) . " DZD\n";
echo "✅ Paiements confirmés: $confirmed_payments\n";
echo "⏳ Paiements en attente: $pending_payments\n";
echo "❌ Paiements échoués: $failed_payments\n";

// Répartition par contexte
$subscription_revenue = Capsule::table('payments')
    ->where('status', 'confirmed')
    ->where('payment_context', 'subscription')
    ->sum('amount');

$session_revenue = Capsule::table('payments')
    ->where('status', 'confirmed')
    ->where('payment_context', 'session')
    ->sum('amount');

$school_entry_revenue = Capsule::table('payments')
    ->where('status', 'confirmed')
    ->where('payment_context', 'school_entry')
    ->sum('amount');

echo "\n📊 RÉPARTITION DES REVENUS:\n";
echo "-" . str_repeat("-", 30) . "\n";
echo "📚 Abonnements: " . number_format($subscription_revenue, 2) . " DZD\n";
echo "🏫 Sessions: " . number_format($session_revenue, 2) . " DZD\n";
echo "🎫 Entrées école: " . number_format($school_entry_revenue, 2) . " DZD\n";

// Étudiants actifs (avec abonnement en cours)
$active_students = Capsule::table('users')
    ->join('subscriptions', 'users.uuid', '=', 'subscriptions.user_uuid')
    ->where('users.role', 'student')
    ->where('subscriptions.starts_at', '<=', Carbon::now())
    ->where('subscriptions.ends_at', '>=', Carbon::now())
    ->distinct('users.uuid')
    ->count();

echo "\n👥 ANALYSE DES ÉTUDIANTS:\n";
echo "-" . str_repeat("-", 30) . "\n";
echo "👥 Total étudiants: $total_students\n";
echo "✅ Étudiants actifs: $active_students\n";
echo "⏸️ Étudiants inactifs: " . ($total_students - $active_students) . "\n";

echo "\n🎉 DONNÉES DE TEST GÉNÉRÉES AVEC SUCCÈS!\n";
echo "🔗 Testez maintenant le dashboard avec ces données réalistes.\n";
echo "📱 Utilisez: Admin Alouaoui / 0555123456 / 123456789\n";