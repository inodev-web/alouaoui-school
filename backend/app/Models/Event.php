<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'slider_image',
        'alt_text',
        'event_type',
        'teacher_id',
        'target_id',
        'redirect_url',
        'requires_subscription',
        'start_date',
        'end_date',
        'is_active',
        'order_index',
        'access_message',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'requires_subscription' => 'boolean',
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public const EVENT_TYPES = ['live', 'session', 'course', 'formation'];

    /**
     * Event belongs to a teacher (only Alouaoui can create events)
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get the target content based on event type and target_id
     */
    public function getTargetContent()
    {
        if (!$this->target_id) {
            return null;
        }

        return match($this->event_type) {
            'course' => Course::find($this->target_id),
            'session' => Session::find($this->target_id),
            'formation' => Chapter::find($this->target_id),
            'live' => null, // Lives might not have a specific model
            default => null,
        };
    }

    /**
     * Get the redirect URL for this event
     */
    public function getRedirectUrl(): ?string
    {
        if ($this->redirect_url) {
            return $this->redirect_url;
        }

        // Generate default redirect based on event type
        return match($this->event_type) {
            'live' => '/student/live/' . $this->id,
            'session' => '/student/sessions/' . $this->target_id,
            'course' => '/student/courses/' . $this->target_id,
            'formation' => '/student/chapters/' . $this->target_id,
            default => null,
        };
    }

    /**
     * Get the full URL for slider image
     */
    public function getSliderImageUrlAttribute(): ?string
    {
        return $this->slider_image ? Storage::url($this->slider_image) : null;
    }

    /**
     * Check if user can access this event
     */
    public function canUserAccess(User $user): bool
    {
        if (!$this->requires_subscription) {
            return true;
        }

        // Check if user has active subscription for the teacher
        return $user->subscriptions()
            ->where('teacher_id', $this->teacher_id)
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    /**
     * Scope for active events
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for events by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    /**
     * Scope for current events (between start and end date)
     */
    public function scopeCurrent($query)
    {
        $now = now();
        return $query->where('start_date', '<=', $now)
                    ->where(function($q) use ($now) {
                        $q->whereNull('end_date')
                          ->orWhere('end_date', '>=', $now);
                    });
    }

    /**
     * Scope ordered for slider display
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_index')->orderBy('start_date');
    }

    /**
     * Check if event is currently active (within date range)
     */
    public function isCurrentlyActive(): bool
    {
        $now = now();
        return $this->start_date <= $now && 
               ($this->end_date === null || $this->end_date >= $now);
    }
}
