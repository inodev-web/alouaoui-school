<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'user_uuid',
        'teacher_id',
        'session_id',
        'date',
        'status',
        'check_in_time',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'check_in_time' => 'datetime',
    ];

    /**
     * The available attendance statuses
     */
    public const STATUSES = ['present', 'absent'];

    /**
     * Attendance belongs to user (student)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function studentByUuid(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    /**
     * Attendance belongs to teacher
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Attendance belongs to session (optional)
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    /**
     * Check if student was present
     */
    public function isPresent(): bool
    {
        return $this->status === 'present';
    }

    /**
     * Check if student was absent
     */
    public function isAbsent(): bool
    {
        return $this->status === 'absent';
    }
}
