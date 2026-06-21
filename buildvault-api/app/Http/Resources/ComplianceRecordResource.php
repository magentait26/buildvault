<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComplianceRecordResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'warning_buffer_days' => (int) $this->warning_buffer_days,
            'attachment_s3_key' => $this->attachment_s3_key,
            'project' => new ProjectResource($this->whenLoaded('project')),
            'days_until_expiry' => $this->getDaysLeft(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Retrieve number of remaining days before RERA or building certificates expire.
     */
    protected function getDaysLeft(): int
    {
        if (!$this->expiry_date) return 0;
        return (int) now()->diffInDays($this->expiry_date, false);
    }
}
