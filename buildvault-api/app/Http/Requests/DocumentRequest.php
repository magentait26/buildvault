<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentRequest extends FormRequest
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
            'project_id' => 'required|uuid|exists:projects,id',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100', // Land Records, Legal, RERA, Construction, etc.
            'status' => 'required|string|in:In_Review,Approved,Pending,Rejected',
            'expiry_date' => 'nullable|date',
            'file' => 'required|file|max:51200', // Files limit 50MB
        ];
    }
}
