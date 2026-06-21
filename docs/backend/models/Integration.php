<?php

namespace App\Models;

use App\Traits\HasTenantScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Integration extends Model
{
    use HasUuids, HasTenantScope;

    protected $fillable = [
        'organization_id',
        'service_provider',
        'is_active',
        'payload_credentials',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Parent organization workspace.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
