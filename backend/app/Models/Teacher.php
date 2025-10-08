<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'year',
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
     * Check if teacher publishes online content
     */
    public function isOnlinePublisher(): bool
    {
        return $this->is_online_publisher;
    }
}
