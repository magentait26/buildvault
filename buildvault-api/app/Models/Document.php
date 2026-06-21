<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'category',
        'status',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];

    /**
     * Parent Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Historical files/revisions uploaded
     */
    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class, 'document_id');
    }

    /**
     * Active/latest uploaded file version
     */
    public function latestVersion(): HasOne
    {
        return $this->hasOne(DocumentVersion::class, 'document_id')
            ->orderByDesc('version_number')
            ->orderByDesc('created_at');
    }

    /**
     * Official clearance sign-off record (if approved)
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class, 'document_id');
    }
}
