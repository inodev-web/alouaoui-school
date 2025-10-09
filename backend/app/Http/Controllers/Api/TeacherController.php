<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherYear;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
    /**
     * Display a paginated listing of teachers with filters (search, year, module)
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 12);
        if ($perPage < 1) { $perPage = 12; }
        $search = $request->get('search');
        $year = $request->get('year');
        $module = $request->get('module');

        $query = Teacher::with('teacherYears');

        if ($search) {
            $s = trim($search);
            $query->where(function($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('module', 'like', "%{$s}%");
            });
        }
        if ($year) {
            $query->teachingYear($year);
        }
        if ($module) {
            $query->where('module', $module);
        }

        $paginated = $query->orderBy('name')->paginate($perPage);

        $data = $paginated->getCollection()->map(fn($t) => $this->formatTeacher($t))->values();

        $modulesList = Teacher::query()->whereNotNull('module')->distinct()->pluck('module')->values();

        // Build filters with Arabic labels
        $modulesFilters = collect($modulesList)->map(fn($m) => [
            'value' => $m,
            'label' => $this->translateModule($m),
        ])->values();
        $yearsFilters = collect(TeacherYear::YEAR_CODES)->map(fn($y) => [
            'value' => $y,
            'label' => TeacherYear::getYearLabel($y),
        ])->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'filters' => [
                'modules' => $modulesFilters,
                'years' => $yearsFilters,
            ]
        ]);
    }

    /** Store a new teacher */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:25|unique:teachers,phone',
            'picture' => 'nullable|string|max:500',
            'module' => 'nullable|string|max:255',
            'years' => 'nullable|array',
            'years.*' => 'string|in:' . implode(',', TeacherYear::YEAR_CODES),
            'is_online_publisher' => 'boolean',
            'price_subscription' => 'nullable|numeric|min:0',
            'price_session' => 'nullable|numeric|min:0',
            'percent_school' => 'nullable|integer|min:0|max:100',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed','errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $years = $data['years'] ?? [];
        unset($data['years']);
        $teacher = Teacher::create($data);
        if (!empty($years)) { $teacher->setTeachingYears($years); }
        return response()->json(['message' => 'Teacher created','data' => $this->formatTeacher($teacher)], 201);
    }

    /** Show a teacher */
    public function show(Teacher $teacher): JsonResponse
    {
        return response()->json(['data' => $this->formatTeacher($teacher)]);
    }

    /** Update a teacher */
    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:25|unique:teachers,phone,' . $teacher->uuid . ',uuid',
            'picture' => 'nullable|string|max:500',
            'module' => 'nullable|string|max:255',
            'years' => 'nullable|array',
            'years.*' => 'string|in:' . implode(',', TeacherYear::YEAR_CODES),
            'is_online_publisher' => 'boolean',
            'price_subscription' => 'nullable|numeric|min:0',
            'price_session' => 'nullable|numeric|min:0',
            'percent_school' => 'nullable|integer|min:0|max:100',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed','errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $years = $data['years'] ?? null;
        unset($data['years']);
        $teacher->update($data);
        if ($years !== null) { $teacher->setTeachingYears($years); }
        return response()->json(['message' => 'Teacher updated','data' => $this->formatTeacher($teacher)]);
    }

    /** Delete a teacher */
    public function destroy(Teacher $teacher): JsonResponse
    {
        $teacher->delete();
        return response()->json(['message' => 'Teacher deleted']);
    }

    /**
     * Get the count of students subscribed to a teacher
     */
    public function getStudentsCount(Teacher $teacher): JsonResponse
    {
        // Compter les étudiants avec des abonnements actifs pour ce professeur
        $count = \App\Models\User::where('role', 'student')
            ->whereHas('subscriptions', function($query) use ($teacher) {
                $query->where('teacher_uuid', $teacher->uuid)
                      ->where('starts_at', '<=', now())
                      ->where('ends_at', '>=', now());
            })
            ->count();

        return response()->json([
            'teacher_uuid' => $teacher->uuid,
            'count' => $count
        ]);
    }

    /** Format helper */
    protected function formatTeacher(Teacher $teacher): array
    {
        $teacher->loadMissing('teacherYears');
        return [
            'uuid' => $teacher->uuid,
            'name' => $teacher->name,
            'phone' => $teacher->phone,
            'picture' => $teacher->picture,
            'module' => $teacher->module,
            'module_label' => $this->translateModule($teacher->module),
            'years' => $teacher->getTeachingYears(),
            'years_formatted' => $teacher->getFormattedYears(),
            'years_labels' => $teacher->getFormattedYearsWithLabels(),
            'is_online_publisher' => $teacher->is_online_publisher,
            'price_subscription' => $teacher->price_subscription,
            'price_session' => $teacher->price_session,
            'percent_school' => $teacher->percent_school,
            'created_at' => $teacher->created_at,
            'updated_at' => $teacher->updated_at,
        ];
    }

    /** Translate module name to Arabic label */
    protected function translateModule(?string $module): string
    {
        if (!$module) { return 'غير محدد'; }
        $normalized = strtolower(trim($module));
        $map = [
            'math' => 'الرياضيات',
            'mathematiques' => 'الرياضيات',
            'physique' => 'الفيزياء',
            'chimie' => 'الكيمياء',
            'science' => 'العلوم',
            'svt' => 'علوم الطبيعة و الحياة',
            'francais' => 'اللغة الفرنسية',
            'français' => 'اللغة الفرنسية',
            'anglais' => 'اللغة الإنجليزية',
            'english' => 'اللغة الإنجليزية',
            'arabic' => 'اللغة العربية',
            'arabe' => 'اللغة العربية',
            'islamiya' => 'التربية الإسلامية',
            'islamic' => 'التربية الإسلامية',
            'histoire' => 'التاريخ',
            'history' => 'التاريخ',
            'geographie' => 'الجغرافيا',
            'géographie' => 'الجغرافيا',
            'geography' => 'الجغرافيا',
            'philosophie' => 'الفلسفة',
            'philosophy' => 'الفلسفة',
            'info' => 'الإعلام الآلي',
            'informatique' => 'الإعلام الآلي',
            'computer science' => 'الإعلام الآلي',
        ];
        return $map[$normalized] ?? $module;
    }
}
