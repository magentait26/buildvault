<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->tokenCan('write:projects');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:Planning,In_Progress,On_Hold,Completed',
            'completion_percentage' => 'numeric|between:0,100',
            'compliance_percentage' => 'numeric|between:0,100',
            'lead_name' => 'required|string|max:150',
            'start_date' => 'nullable|date',
            'handover_date' => 'nullable|date|after_or_equal:start_date',
        ];
    }
}
