<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Teacher extends Model
{
    use HasFactory;

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'uuid';

    /**
     * Disable auto-incrementing for UUID primary key.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'phone',
        'picture',
        'module',
        'is_online_publisher',
        'price_subscription',
        'price_session',
        'percent_school',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_online_publisher' => 'boolean',
        'price_subscription' => 'decimal:2',
        'price_session' => 'decimal:2',
        'percent_school' => 'integer',
    ];

    /**
     * The available years
     */
    public const YEARS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

    /**
     * Alouaoui teacher UUID (fixed)
     */
    public const ALOUAOUI_UUID = 'alouaoui-teacher-uuid-fixed';

    /**
     * Boot model to generate uuid on create if missing
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    /**
     * Teacher has many subscriptions
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Teacher has many sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Teacher has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Teacher years relationship (pivot table)
     */
    public function teacherYears(): HasMany
    {
        return $this->hasMany(TeacherYear::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Get all year codes this teacher teaches (using pivot table)
     */
    public function years(): array
    {
        return $this->teacherYears()->pluck('year_code')->toArray();
    }

    /**
     * Check if teacher publishes online content
     */
    public function isOnlinePublisher(): bool
    {
        return $this->is_online_publisher;
    }

    /**
     * Get Alouaoui teacher instance
     */
    public static function getAlouaoui(): ?Teacher
    {
        return static::where('uuid', static::ALOUAOUI_UUID)->first();
    }

    /**
     * Get Alouaoui teacher instance (alias)
     */
    public static function alouaoui(): ?Teacher
    {
        return static::getAlouaoui();
    }

    /**
     * Check if this teacher is Alouaoui
     */
    public function isAlouaoui(): bool
    {
        return $this->uuid === static::ALOUAOUI_UUID;
    }

    /**
     * Get all years this teacher teaches
     *
     * @return array
     */
    public function getTeachingYears(): array
    {
        return $this->years();
    }

    /**
     * Set the years this teacher teaches
     *
     * @param array $years
     * @return void
     */
    public function setTeachingYears(array $years): void
    {
        // Supprimer les anciens years
        TeacherYear::where('teacher_uuid', $this->uuid)->delete();

        // Ajouter les nouveaux years
        foreach (array_unique($years) as $year) {
            TeacherYear::create([
                'teacher_uuid' => $this->uuid,
                'year_code' => $year
            ]);
        }
    }

    /**
     * Add a year to the teaching years
     *
     * @param string $year
     * @return void
     */
    public function addTeachingYear(string $year): void
    {
        TeacherYear::firstOrCreate([
            'teacher_uuid' => $this->uuid,
            'year_code' => $year
        ]);
    }

    /**
     * Remove a year from the teaching years
     *
     * @param string $year
     * @return void
     */
    public function removeTeachingYear(string $year): void
    {
        TeacherYear::where('teacher_uuid', $this->uuid)
                   ->where('year_code', $year)
                   ->delete();
    }

    /**
     * Check if teacher teaches a specific year
     *
     * @param string $year
     * @return bool
     */
    public function teachesYear(string $year): bool
    {
        return TeacherYear::where('teacher_uuid', $this->uuid)
                         ->where('year_code', $year)
                         ->exists();
    }

    /**
     * Get formatted years string for display
     *
     * @return string
     */
    public function getFormattedYears(): string
    {
        $years = $this->getTeachingYears();
        if (empty($years)) {
            return 'غير محدد';
        }

        return implode(', ', $years);
    }

    /**
     * Get formatted years with Arabic labels
     *
     * @return string
     */
    public function getFormattedYearsWithLabels(): string
    {
        $years = $this->getTeachingYears();
        if (empty($years)) {
            return 'غير محدد';
        }

        $labels = array_map(function($year) {
            return TeacherYear::getYearLabel($year);
        }, $years);

        return implode(', ', $labels);
    }

    /**
     * Scope to filter teachers by year
     */
    public function scopeTeachingYear($query, string $year)
    {
        return $query->whereHas('teacherYears', function($q) use ($year) {
            $q->where('year_code', $year);
        });
    }
}
