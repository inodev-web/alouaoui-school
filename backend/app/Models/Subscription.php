<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon; // ensure Carbon reference from framework

class Subscription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_uuid',
        'teacher_uuid',
        'starts_at',
        'ends_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    // Marker constants for potential classification logic (monthly vs pass) if needed later
    public const TYPE_MONTHLY = 'monthly';
    public const TYPE_SESSION_PASS = 'session_pass';

    /**
     * Subscription belongs to user (student)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    /**
     * Subscription belongs to user (student) - alias for backward compatibility
     */
    public function student(): BelongsTo
    {
        return $this->user();
    }

    /**
     * Subscription belongs to teacher
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_uuid', 'uuid');
    }

    /**
     * Check if subscription is currently active
     */
    public function isActive(): bool
    {
        return $this->starts_at <= now() && $this->ends_at >= now();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        return $this->ends_at < now();
    }

    /**
     * Get days remaining
     */
    public function daysRemaining(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return now()->diffInDays($this->ends_at);
    }

    /**
     * Determine if subscription spans roughly a month (>= 28 days window) - heuristic monthly
     */
    public function isMonthly(): bool
    {
        if (!$this->starts_at || !$this->ends_at) {
            return false;
        }
        $start = $this->starts_at instanceof Carbon ? $this->starts_at : Carbon::parse($this->starts_at);
        $end = $this->ends_at instanceof Carbon ? $this->ends_at : Carbon::parse($this->ends_at);
        return $start->diffInDays($end) >= 28;
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $userUuid
     * @param string $teacherUuid
     * @param Carbon|string $startsAt
     * @param Carbon|string $endsAt
     */
    public function scopeOverlapping($query, string $userUuid, string $teacherUuid, $startsAt, $endsAt)
    {
        $startsAt = $startsAt instanceof Carbon ? $startsAt : Carbon::parse($startsAt);
        $endsAt = $endsAt instanceof Carbon ? $endsAt : Carbon::parse($endsAt);
        return $query->where('user_uuid', $userUuid)
            ->where('teacher_uuid', $teacherUuid)
            ->where(function ($q) use ($startsAt, $endsAt) {
                $q->whereBetween('starts_at', [$startsAt, $endsAt])
                  ->orWhereBetween('ends_at', [$startsAt, $endsAt])
                  ->orWhere(function ($inner) use ($startsAt, $endsAt) {
                      $inner->where('starts_at', '<=', $startsAt)
                            ->where('ends_at', '>=', $endsAt);
                  });
            });
    }
}
