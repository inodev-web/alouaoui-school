<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'uuid';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'firstname',
        'lastname',
        'birth_date',
        'address',
        'school_name',
        'phone',
        'password',
        'year_of_study',
        'role',
        'device_uuid',
        'branch_id', // Branch for high school students
        // New simplified access model fields
        'free_subscriber',
        'free_subscriber_reason',
        'picture', // lien vers l'image de profil
        'last_profile_update_at', // suivi limitation modification quotidienne
    ];

    /**
     * Disable auto-incrementing for UUID primary key.
     * This tells Eloquent to treat the primary key as a non-incrementing string.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     * Using string because we'll use UUIDs as PK.
     */
    protected $keyType = 'string';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'password' => 'hashed',
            'free_subscriber' => 'boolean',
            'last_profile_update_at' => 'datetime',
        ];
    }

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
     * The available roles
     */
    public const ROLES = ['admin', 'student'];

    /**
     * The available years of study
     */
    public const YEARS_OF_STUDY = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is student
     */
    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    /**
     * User has many subscriptions
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'user_uuid');
    }

    /**
     * User has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_uuid');
    }

    /**
     * Get active subscriptions (time window based)
     */
    public function activeSubscriptions(): HasMany
    {
        return $this->subscriptions()
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now());
    }

    /**
     * Determine if user is flagged as free subscriber (global access bypass)
     */
    public function isFree(): bool
    {
        return (bool) $this->free_subscriber;
    }

    /**
     * Check if user currently has an active subscription for a given teacher
     */
    public function hasActiveSubscriptionForTeacher(string $teacherUuid): bool
    {
        return $this->subscriptions()
            ->where('teacher_uuid', $teacherUuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    /**
     * User belongs to a branch (for high school students)
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Check if user is a high school student (has branch)
     */
    public function isHighSchoolStudent(): bool
    {
        return $this->isStudent() && in_array($this->year_of_study, ['1AS', '2AS', '3AS']);
    }

    /**
     * Check if user is a middle school student (no branch)
     */
    public function isMiddleSchoolStudent(): bool
    {
        return $this->isStudent() && in_array($this->year_of_study, ['1AM', '2AM', '3AM', '4AM']);
    }

    /**
     * Get available branches for user's year level
     */
    public function getAvailableBranches()
    {
        if (!$this->isHighSchoolStudent()) {
            return collect();
        }

        return Branch::getForYearLevel($this->year_of_study);
    }
}
