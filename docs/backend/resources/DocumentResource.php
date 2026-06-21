<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'status' => $this->status,
            'current_version' => (int) $this->current_version,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'project' => new ProjectResource($this->whenLoaded('project')),
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'versions' => DocumentVersionResource::collection($this->whenLoaded('versions')),
            'latest_version' => new DocumentVersionResource($this->whenLoaded('latestVersion')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
