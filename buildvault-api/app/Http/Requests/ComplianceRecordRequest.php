<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComplianceRecordRequest extends FormRequest
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
        $id = $this->route('compliance_record');
        $projectId = $this->input('project_id');

        return [
            'project_id' => $id ? 'sometimes|uuid|exists:projects,id' : 'required|uuid|exists:projects,id',
            'title' => [
                $id ? 'sometimes' : 'required',
                'string',
                'max:255',
                Rule::unique('compliance_checklists', 'title')->where(function($q) use ($projectId, $recordId) {
                    $pId = $projectId ?? ($this->route('compliance_record') ? \App\Models\ComplianceRecord::find($this->route('compliance_record'))->project_id : null);
                    return $q->where('project_id', $pId);
                })->ignore($id)
            ],
            'expiry_date' => $id ? 'sometimes|date' : 'required|date',
            'warning_buffer_days' => 'sometimes|integer|min:0|max:180',
            'attachment_s3_key' => 'nullable|string|max:1024',
            'status' => 'sometimes|required|string|in:Complete,Pending,Expiring,Missing',
        ];
    }
}
