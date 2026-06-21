<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->tokenCan('manage:settings');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'app_name' => 'sometimes|required|string|max:100',
            'allowed_file_types' => 'sometimes|required|array',
            'allowed_file_types.*' => 'string|max:10',
            'file_size_limit_mb' => 'sometimes|required|integer|min:1|max:500',
            'enable_mfa' => 'sometimes|required|boolean',
            'active_storage_provider' => 'sometimes|required|string|in:local,s3',
            'enabled_modules' => 'sometimes|required|array',
            'enabled_modules.*' => 'string|max:50',
        ];
    }
}
