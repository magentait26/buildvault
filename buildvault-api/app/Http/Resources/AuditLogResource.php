<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actor_id' => $this->user_id,
            'actor_name' => $this->user_name,
            'actor_role' => $this->user_role,
            'action' => $this->action,
            'details' => $this->details,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'previous_row_hash' => $this->previous_row_hash,
            'timestamp' => $this->created_at?->toIso8601String(),
        ];
    }
}
