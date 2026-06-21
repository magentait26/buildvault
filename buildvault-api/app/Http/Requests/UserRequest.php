<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
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
        $userId = $this->route('user');

        return [
            'name' => 'required|string|max:150',
            'email' => [
                'required',
                'email',
                'max:254',
                $userId ? Rule::unique('users', 'email')->ignore($userId) : 'unique:users,email'
            ],
            'password' => $userId ? 'sometimes|string|min:8' : 'required|string|min:8',
            'role_id' => 'required|uuid|exists:roles,id',
            'avatar_url' => 'nullable|url|max:512',
            'assigned_project_ids' => 'nullable|array',
            'assigned_project_ids.*' => 'uuid|exists:projects,id',
        ];
    }
}
