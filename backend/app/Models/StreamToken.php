<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StreamToken extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'token',
        'ip_address',
        'user_agent',
        'expires_at',
        'accessed_at',
        'is_used',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'accessed_at' => 'datetime',
        'is_used' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * StreamToken belongs to user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * StreamToken belongs to course
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Check if token is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    /**
     * Check if token is valid (not expired and not used)
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->is_used;
    }

    /**
     * Mark token as used
     */
    public function markAsUsed(): bool
    {
        return $this->update([
            'is_used' => true,
            'accessed_at' => now(),
        ]);
    }

    /**
     * Generate a unique token
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * Create a new stream token
     */
    public static function createForCourse(User $user, Course $course, int $expirationMinutes = 120): self
    {
        return self::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'token' => self::generateToken(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'expires_at' => now()->addMinutes($expirationMinutes),
            'metadata' => [
                'device_type' => request()->header('X-Device-Type'),
                'app_version' => request()->header('X-App-Version'),
                'location' => request()->header('X-Location'),
            ],
        ]);
    }
}
