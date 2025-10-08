<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Session extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
    'teacher_uuid',
        'year_target',
        'start_time',
        'end_time',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * The available session types
     */
    // Types removed in simplified model

    /**
     * The available session statuses
     */
    // Simplified per DATABASE.md: only completed | cancelled retained.
    public const STATUSES = ['completed', 'cancelled'];

    /**
     * The available year targets
     */
    public const YEAR_TARGETS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

    /**
     * Session belongs to teacher
     */
    public function teacher(): BelongsTo
    {
    return $this->belongsTo(Teacher::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Session has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Check if session is live
     */
    public function isLive(): bool
    {
        // no live state in simplified model
        return false;
    }

    /**
     * Check if session is scheduled
     */
    public function isScheduled(): bool
    {
        return false; // scheduled concept removed
    }

    /**
     * Check if session is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if session is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Duration in minutes
     */
    public function durationMinutes(): ?int
    {
        if (!$this->start_time || !$this->end_time) {
            return null;
        }
        return $this->start_time->diffInMinutes($this->end_time);
    }
}
