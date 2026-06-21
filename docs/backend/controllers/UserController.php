<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of corporate member profiles.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['role', 'assignedProjects']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->input('role_id'));
        }

        if ($request->filled('status')) {
            $status = $request->input('status') === 'Active' ? true : false;
            $query->where('is_active', $status);
        }

        $users = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }

    /**
     * Store a newly created legal corporate account profile.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Corporate team modification privileges required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:254|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'required|uuid|exists:roles,id',
            'avatar_url' => 'nullable|url|max:512',
            'assigned_project_ids' => 'nullable|array',
            'assigned_project_ids.*' => 'uuid|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->input('name'),
            'email' => strtolower(trim($request->input('email'))),
            'password_hash' => Hash::make($request->input('password')),
            'role_id' => $request->input('role_id'),
            'avatar_url' => $request->input('avatar_url'),
            'is_active' => true,
        ]);

        if ($request->filled('assigned_project_ids')) {
            $user->assignedProjects()->sync($request->input('assigned_project_ids'));
        }

        // Write Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Create Corporate Identity',
            'details' => "Registered corporate collaborator profile '{$user->name}' ({$user->email}) with Role UUID: {$user->role_id}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Corporate account onboarded successfully.',
            'user' => $user->load('role')
        ], 201);
    }

    /**
     * Fetch user profile metadata card.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with(['role.permissions', 'assignedProjects'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User profile missing or disabled.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    /**
     * Alter characteristics, roles, project groupings of member accounts.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Enterprise supervisor clearance required for user alterations.'
            ], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Corporate target user does not exist.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:150',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:254',
                Rule::unique('users', 'email')->ignore($id)
            ],
            'password' => 'sometimes|string|min:8',
            'role_id' => 'sometimes|required|uuid|exists:roles,id',
            'avatar_url' => 'nullable|url|max:512',
            'is_active' => 'sometimes|required|boolean',
            'assigned_project_ids' => 'nullable|array',
            'assigned_project_ids.*' => 'uuid|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updatePayload = $validator->validated();

        if ($request->has('password')) {
            $updatePayload['password_hash'] = Hash::make($request->input('password'));
            unset($updatePayload['password']);
        }

        $user->update($updatePayload);

        if ($request->has('assigned_project_ids')) {
            $user->assignedProjects()->sync($request->input('assigned_project_ids'));
        }

        // Auditing update
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Modify Corporate Identity',
            'details' => "Updated administrative profiles settings for '{$user->name}' (Status Active: " . ($user->is_active ? 'True' : 'False') . ")",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Corporate specifications modified successfully.',
            'user' => $user->load(['role', 'assignedProjects'])
        ]);
    }

    /**
     * Execute soft deletions of inactive users to maintain files integrity logs.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Supervisor high-level credential requested.'
            ], 403);
        }

        if ($id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot eliminate own gateway authorization token active session.'
            ], 400);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Target identity has already been removed.'
            ], 404);
        }

        $userName = $user->name;
        $user->delete();

        // Audit Trail Entry
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Revoke Access Grant',
            'details' => "Executed administrative soft delete on profile '{$userName}' (ID: {$id}).",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User identity deactivated and soft deleted.'
        ]);
    }
}
