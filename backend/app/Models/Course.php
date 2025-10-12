<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'chapter_id',
        'title',
        'video_ref',
        'description',
        'duration',
        'pdf_summary',
        'exercises_pdf',
    ];

    /**
     * The available year targets
     */

    /**
     * Course belongs to chapter
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the year target from the chapter
     */
    public function getYearTargetAttribute()
    {
        return $this->chapter?->year_target;
    }
}
