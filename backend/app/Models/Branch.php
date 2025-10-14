<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'name_en',
        'code',
        'year_level',
        'is_active',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * The available year levels for branches
     */
    public const YEAR_LEVELS = ['1AS', '2AS', '3AS'];

    /**
     * Branch has many users (students)
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'branch_id');
    }

    /**
     * Branch has many sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'branch_id');
    }

    /**
     * Scope to filter branches by year level
     */
    public function scopeForYearLevel($query, string $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    /**
     * Scope to filter active branches
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get branches for a specific year level
     */
    public static function getForYearLevel(string $yearLevel): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()
            ->forYearLevel($yearLevel)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Check if this branch is for high school years
     */
    public function isHighSchool(): bool
    {
        return in_array($this->year_level, ['1AS', '2AS', '3AS']);
    }

    /**
     * Check if this branch is for middle school years
     */
    public function isMiddleSchool(): bool
    {
        return in_array($this->year_level, ['1AM', '2AM', '3AM', '4AM']);
    }
}
