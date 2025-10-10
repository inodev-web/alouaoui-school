<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherYear extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'teacher_uuid',
        'year_code',
    ];

    /**
     * Get the teacher that owns this year assignment
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Available year codes
     */
    public const YEAR_CODES = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

    /**
     * Get year labels in Arabic
     */
    public static function getYearLabels(): array
    {
        return [
            '1AM' => 'السنة الأولى متوسط',
            '2AM' => 'السنة الثانية متوسط',
            '3AM' => 'السنة الثالثة متوسط',
            '4AM' => 'السنة الرابعة متوسط',
            '1AS' => 'السنة الأولى ثانوي',
            '2AS' => 'السنة الثانية ثانوي',
            '3AS' => 'السنة الثالثة ثانوي',
        ];
    }

    /**
     * Get year label for a specific code
     */
    public static function getYearLabel(string $code): string
    {
        $labels = static::getYearLabels();
        return $labels[$code] ?? $code;
    }

    /**
     * Get formatted year for display
     */
    public function getFormattedYearAttribute(): string
    {
        return static::getYearLabel($this->year_code);
    }
}
