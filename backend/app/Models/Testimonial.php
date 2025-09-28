<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Testimonial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'image',
        'opinion',
        'rating',
        'is_active',
        'order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:1',
        'order' => 'integer'
    ];

    protected $attributes = [
        'is_active' => true,
        'rating' => 5.0,
        'order' => 1
    ];

    /**
     * Scope for active testimonials
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered testimonials
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('created_at', 'desc');
    }

    /**
     * Get the full URL for the testimonial image
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        // If it starts with /storage/, return with app URL
        if (str_starts_with($this->image, '/storage/')) {
            return config('app.url') . $this->image;
        }

        // Otherwise, assume it's a relative path and prepend storage URL
        return config('app.url') . '/storage/' . $this->image;
    }

    /**
     * Automatically set order when creating new testimonial
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($testimonial) {
            if (!$testimonial->order) {
                $testimonial->order = static::max('order') + 1;
            }
        });
    }
}