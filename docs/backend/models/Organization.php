<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'domain_subprefix',
        'gst_number',
        'billing_email',
        'status',
    ];

    /**
     * Users associated with this organization.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Projects associated with this organization.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * System settings associated with this organization.
     */
    public function systemSettings(): HasMany
    {
        return $this->hasMany(SystemSetting::class);
    }
}
