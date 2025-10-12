<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Payment extends Model
{
    protected $fillable = [
        'student_uuid',
        'teacher_uuid', 
        'amount',
        'method',
        'status',
        'payment_context',
        'grants_school_entry',
        'processor_reference',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'grants_school_entry' => 'boolean',
    ];

    // Payment methods
    const METHODS = ['online', 'cash'];
    
    // Payment statuses
    const STATUSES = ['pending', 'confirmed', 'failed'];
    
    // Payment contexts
    const CONTEXTS = ['subscription', 'session', 'school_entry'];

    /**
     * Get the student that made this payment
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_uuid', 'uuid');
    }

    /**
     * Get the teacher this payment is for
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_uuid', 'uuid');
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
        return $this->update(['status' => 'confirmed']);
    }

    /**
     * Mark payment as failed
     */
    public function markAsFailed(): bool
    {
        return $this->update(['status' => 'failed']);
    }
}