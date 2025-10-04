<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

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
        'qr_token',
        'uuid',
    ];

    /**
     * Disable auto-incrementing for UUID primary key (migration later will switch PK).
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
            'uuid' => 'string',
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
        return $this->hasMany(Subscription::class, 'user_id');
    }

    /**
     * User has many payments
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    /**
     * User has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    /**
     * Get active subscriptions
     */
    public function activeSubscriptions(): HasMany
    {
        return $this->subscriptions()
            ->where('active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }
}
