<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'teacher_id',
        'amount',
        'method',
        'payment_context',
        'status',
        'grants_school_entry',
        'payment_details',
        'transaction_id',
        'processor_reference',
        'confirmed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'grants_school_entry' => 'boolean',
        'payment_details' => 'array',
        'confirmed_at' => 'datetime',
    ];

    /**
     * The available payment methods
     */
    public const METHODS = ['online', 'cash'];

    /**
     * The available payment statuses
     */
    public const STATUSES = ['pending', 'confirmed', 'failed'];

    /**
     * The available payment contexts
     */
    public const CONTEXTS = ['subscription', 'session', 'school_entry'];

    /**
     * Payment belongs to user (student)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Payment belongs to teacher
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Check if payment is confirmed
     */
    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    /**
     * Check if payment is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Mark payment as confirmed
     */
    public function markAsConfirmed(): bool
    {
        return $this->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Mark payment as failed
     */
    public function markAsFailed(): bool
    {
        return $this->update(['status' => 'failed']);
    }
}
