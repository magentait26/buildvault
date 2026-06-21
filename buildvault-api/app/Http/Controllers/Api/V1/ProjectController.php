<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    /**
     * Display a listing of physical properties & compliance records.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Project::query()->withCount('documents');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Project list sorting
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_order', 'desc');
        
        $allowedSorts = ['name', 'location', 'start_date', 'status', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $projects = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'projects' => $projects
        ]);
    }

    /**
     * Create a new compliance-controlled property blueprint.
     */
    public function store(Request $request): JsonResponse
    {
        // Enforce RBAC through Sanctum Abilities
        if (!$request->user()->tokenCan('write:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action. Required capabilities missing.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'start_date' => 'required|date',
            'handover_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|string|in:Planning,Active,On Hold,Completed,Archived',
            'rera_registration_no' => 'nullable|numeric',
            'rera_registration_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $project = Project::create($validator->validated());

        // Assign current project manager user as default team member
        $project->users()->attach($request->user()->id);

        // Audit Trail entry
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Create Project',
            'details' => "Registered new property record '{$project->name}' (ID: {$project->id}) with RERA registration #{$project->rera_registration_id}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Clearance Project declared successfully.',
            'project' => $project
        ], 201);
    }

    /**
     * Retrieve project metadata.
     */
    public function show(string $id): JsonResponse
    {
        $project = Project::with(['documents.latestVersion', 'users.role'])->find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project record missing or deleted.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'project' => $project
        ]);
    }

    /**
     * Modifies RERA targets, timelines, and status indices.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('write:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized alteration privileges.'
            ], 403);
        }

        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Target project record does not exist.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|required|date',
            'handover_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|required|string|in:Planning,Active,On Hold,Completed,Archived',
            'rera_registration_no' => 'nullable|numeric',
            'rera_registration_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $project->update($validator->validated());

        // Audit Trail Entry
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Modify Project',
            'details' => "Modified characteristics of site record '{$project->name}'. Status: {$project->status}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Property specifications refreshed successfully.',
            'project' => $project
        ]);
    }

    /**
     * Soft delete property records to keep integrity of linked digital files.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('delete:projects')) {
            return response()->json([
                'success' => false,
                'message' => 'Corporate administrative privileges required.'
            ], 403);
        }

        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Target project record not found.'
            ], 404);
        }

        $projectName = $project->name;
        $project->delete();

        // Audit log Entry
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Soft Delete Project',
            'details' => "Soft-deleted construction index: '{$projectName}' (ID: {$id}). Saved database logs preserved.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compliance project record soft deleted.'
        ]);
    }
}
