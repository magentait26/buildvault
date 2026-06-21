<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'completion_percentage' => (float) $this->completion_percentage,
            'compliance_percentage' => (float) $this->compliance_percentage,
            'lead_name' => $this->lead_name,
            'start_date' => $this->start_date?->toDateString(),
            'handover_date' => $this->handover_date?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
