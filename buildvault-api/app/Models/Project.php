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
        'project_code',
        'category',
        'description',
    ];

    protected $appends = [
        'rere_registration_no',
    ];

    protected $casts = [
        'start_date' => 'date',
        'handover_date' => 'date',
    ];

    /**
     * Get the backward-compatible RERA registration number typo.
     */
    public function getRereRegistrationNoAttribute()
    {
        return $this->rera_registration_no;
    }

    /**
     * Set the backward-compatible RERA registration number typo.
     */
    public function setRereRegistrationNoAttribute($value)
    {
        $this->attributes['rera_registration_no'] = $value;
    }

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
