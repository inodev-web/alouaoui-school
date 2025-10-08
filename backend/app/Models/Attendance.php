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
        'student_uuid',
        'teacher_uuid',
        'session_id',
        'validated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'validated_at' => 'datetime',
    ];

    /**
     * Attendance belongs to user (student)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_uuid', 'uuid');
    }

    /**
     * Attendance belongs to teacher
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Attendance belongs to session (optional)
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    /**
     * Determine if attendance was validated by an admin/teacher (has validated_at timestamp)
     */
    public function isValidated(): bool
    {
        return !is_null($this->validated_at);
    }
}
