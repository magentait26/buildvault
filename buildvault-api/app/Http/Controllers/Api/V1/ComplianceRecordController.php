<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ComplianceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ComplianceRecordController extends Controller
{
    /**
     * Index of construction licenses, clearances, and structural NOC checklists.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ComplianceRecord::with('project');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filters: pending warning evaluations, expiring licenses
        if ($request->input('expiring_soon')) {
            $query->whereDate('expiry_date', '<=', now()->addDays(45))
                  ->where('status', '!=', 'Complete');
        }

        $records = $query->orderBy('expiry_date', 'asc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'compliance_records' => $records
        ]);
    }

    /**
     * Store dynamic clearance targets (such as RERA updates, Civil certifications).
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('write:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking authorization keys to append certification metrics.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'project_id' => 'required|uuid|exists:projects,id',
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('compliance_checklists')->where(function($q) use ($request) {
                    return $q->where('project_id', $request->input('project_id'));
                })
            ],
            'expiry_date' => 'required|date',
            'warning_buffer_days' => 'sometimes|integer|min:0|max:180',
            'attachment_s3_key' => 'nullable|string|max:1024',
            'status' => 'required|string|in:Complete,Pending,Expiring,Missing',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $record = ComplianceRecord::create($validator->validated());

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Create Compliance Target',
            'details' => "Registered new statutory requirement checklist '{$record->title}' for Project UUID: {$record->project_id}. Hard deadline: {$record->expiry_date}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compliance index added successfully.',
            'compliance_record' => $record
        ], 201);
    }

    /**
     * Update clearance checklist status, buffer thresholds, or proofs.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('write:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized compliance alter privileges.'
            ], 403);
        }

        $record = ComplianceRecord::find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Clearance checklist target record not found.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('compliance_checklists')->where(function($q) use ($record) {
                    return $q->where('project_id', $record->project_id);
                })->ignore($id)
            ],
            'expiry_date' => 'sometimes|required|date',
            'warning_buffer_days' => 'sometimes|required|integer|min:0|max:180',
            'attachment_s3_key' => 'nullable|string|max:1024',
            'status' => 'sometimes|required|string|in:Complete,Pending,Expiring,Missing',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $record->update($validator->validated());

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Modify Compliance Target',
            'details' => "Modified statutory requirement '{$record->title}'. New status: {$record->status}, Date: {$record->expiry_date}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compliance index specifications updated.',
            'compliance_record' => $record
        ]);
    }

    /**
     * Soft delete compliance criteria checklist targets.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('delete:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Administrative privilege verified negative.'
            ], 403);
        }

        $record = ComplianceRecord::find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Compliance criteria checklist index not found.'
            ], 404);
        }

        $title = $record->title;
        $record->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Soft Delete Compliance Target',
            'details' => "Soft-deleted compliance metric index '{$title}' (ID: {$id}). Audit historical records preserved.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compliance checklist index deleted and archived.'
        ]);
    }
}
