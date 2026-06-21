<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public $timestamps = false; // Only uses created_at timestamp

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    /**
     * User who executed this operational event
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault([
            'name' => $this->user_name ?? 'System',
            'role' => $this->user_role ?? 'System Process',
        ]);
    }
}
