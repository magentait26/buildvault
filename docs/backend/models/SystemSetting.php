<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'logo_storage_path',
        'primary_color',
        'secondary_color',
        'allowed_file_types',
        'file_size_limit_mb',
        'active_storage_provider',
        'aws_s3_bucket',
        'aws_s3_region',
        'aws_access_key',
        'aws_secret_key',
        'enabled_modules',
    ];

    protected $casts = [
        'allowed_file_types' => 'array',
        'enabled_modules' => 'array',
        'file_size_limit_mb' => 'integer',
    ];

    /**
     * Parent organization workspace
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }
}
