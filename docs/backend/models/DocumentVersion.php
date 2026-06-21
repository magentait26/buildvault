<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'document_id',
        'uploaded_by_user_id',
        'version_number',
        'file_name',
        'storage_path',
        'file_hash',
        'file_size_bytes',
    ];

    /**
     * Parent Document definition
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    /**
     * User who uploaded this version revision
     */
    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
