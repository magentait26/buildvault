<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApprovalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->tokenCan('write:documents');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'document_id' => 'required|uuid|exists:documents,id',
            'priority' => 'required|string|in:Low,Medium,High',
            'approver_ids' => 'required|array|min:1',
            'approver_ids.*' => 'uuid|exists:users,id',
        ];
    }
}
