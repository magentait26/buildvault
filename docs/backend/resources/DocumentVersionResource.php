<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentVersionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'version_number' => (int) $this->version_number,
            'file_name' => $this->file_name,
            'storage_path' => $this->storage_path,
            'file_hash' => $this->file_hash,
            'file_size_bytes' => (int) $this->file_size_bytes,
            'file_size_friendly' => $this->getFriendlySize(),
            'publisher' => new UserResource($this->whenLoaded('publisher')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Convert size in bytes into human-readable strings like KB or MB.
     */
    protected function getFriendlySize(): string
    {
        $bytes = $this->file_size_bytes;
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = floor(log($bytes, 1024));
        return round($bytes / pow(1024, $power), 2) . ' ' . $units[$power];
    }
}
