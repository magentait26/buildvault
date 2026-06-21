<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle authentication and issue a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::with(['role.permissions'])->where('email', $request->email)->first();

        // Standard Laravel Hash check
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Credentials unrecognized or inactive.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is currently suspended. Contact your Super Admin.'
            ], 403);
        }

        // Generate Sanctum dynamic token
        $token = $user->createToken('buildvault-gatepass', $user->role->permissions->pluck('slug')->toArray())->plainTextToken;

        // Log action in Audit Trail
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role->name,
            'action' => 'User Auth',
            'details' => "Successfully requested secure session token via portal. IP: {$request->ip()}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Authorized successfully.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role->name,
                'permissions' => $user->role->permissions->pluck('slug')->toArray(),
            ]
        ]);
    }

    /**
     * Fetch standard authenticated user state with permissions.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role->name,
                'permissions' => $user->role->permissions->pluck('slug')->toArray(),
            ]
        ]);
    }

    /**
     * Revoke tokens and destroy session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke the current token
        $user->currentAccessToken()->delete();

        // Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role->name,
            'action' => 'Revoke Auth',
            'details' => 'Securely terminated gateway token cache.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terminated gateway session successfully.'
        ]);
    }
}
