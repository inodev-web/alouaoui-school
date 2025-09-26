<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'specialization',
        'bio',
        'is_alouaoui_teacher',
        'is_active',
        'module',
        'year',
        'is_online_publisher',
        'allows_online_payment',
        'price_subscription',
        'percent_school',
        'payment_processor_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'is_online_publisher' => 'boolean',
        'is_alouaoui_teacher' => 'boolean',
        'allows_online_payment' => 'boolean',
        'price_subscription' => 'decimal:2',
        'percent_school' => 'integer',
    ];

    /**
     * The available years
     */
    public const YEARS = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

    /**
     * Teacher has many chapters
     */
    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    /**
     * Teacher has many subscriptions
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Teacher has many payments (through subscriptions)
     * Note: Payments table doesn't have teacher_id, only user_id
     */
    // public function payments(): HasMany
    // {
    //     return $this->hasMany(Payment::class);
    // }

    /**
     * Teacher has many sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    /**
     * Teacher has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get active subscriptions for this teacher
     */
    public function activeSubscriptions(): HasMany
    {
        return $this->subscriptions()
            ->where('active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    /**
     * Check if teacher is Alouaoui teacher
     */
    public function isAlouaouiTeacher(): bool
    {
        return $this->is_alouaoui_teacher;
    }

    /**
     * Check if teacher publishes online content
     */
    public function isOnlinePublisher(): bool
    {
        return $this->is_online_publisher;
    }
}
