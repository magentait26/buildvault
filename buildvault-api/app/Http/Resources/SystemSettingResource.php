<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'app_name' => $this->app_name,
            'allowed_file_types' => $this->allowed_file_types,
            'file_size_limit_mb' => (int) $this->file_size_limit_mb,
            'enable_mfa' => (bool) $this->enable_mfa,
            'active_storage_provider' => $this->active_storage_provider,
            'enabled_modules' => $this->enabled_modules,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
