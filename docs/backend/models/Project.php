<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'location',
        'start_date',
        'handover_date',
        'status',
        'rera_registration_no',
        'rera_registration_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'handover_date' => 'date',
        'rera_registration_no' => 'float',
    ];

    /**
     * Users/staff assigned to this project
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user', 'project_id', 'user_id');
    }

    /**
     * Documents belonging to this project (e.g. Clearance Certifications)
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'project_id');
    }
}
