<?php

namespace App\Models;

use App\Traits\HasOrganizationScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComplianceRecord extends Model
{
    use HasUuids, SoftDeletes, HasOrganizationScope;

    /**
     * Map model to correct database table.
     */
    protected $table = 'compliance_checklists';

    protected $fillable = [
        'organization_id',
        'project_id',
        'title',
        'status',
        'expiry_date',
        'warning_buffer_days',
        'attachment_s3_key',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'warning_buffer_days' => 'integer',
    ];

    /**
     * Corporate organization relation.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    /**
     * Physical property site relation.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
