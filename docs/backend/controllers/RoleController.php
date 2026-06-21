<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    /**
     * Map fine-grained enterprise roles context.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json([
            'success' => true,
            'roles' => $roles
        ]);
    }

    /**
     * Retrieve complete standard granular permission slugs catalog.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();

        return response()->json([
            'success' => true,
            'permissions' => $permissions
        ]);
    }

    /**
     * Store customized roles. Only accessible to Super Admins.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking custom role registration credentials.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100|unique:roles,name',
            'description' => 'required|string|max:500',
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'uuid|exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role = Role::create([
            'id' => (string) Str::uuid(),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
        ]);

        $role->permissions()->sync($request->input('permission_ids'));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Create Custom Role',
            'details' => "Engineered custom workspace RBAC group '{$role->name}' with " . count($request->input('permission_ids')) . " custom permissions permissions.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role and abilities mapping established.',
            'role' => $role->load('permissions')
        ], 201);
    }
}
