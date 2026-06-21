<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Retrieve statutory system workspace configuration and modules.
     */
    public function show(Request $request): JsonResponse
    {
        $settings = SystemSetting::first();

        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration settings record missing.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * Refresh enterprise clearance boundaries, colors, and features.
     */
    public function update(Request $request): JsonResponse
    {
        // Require absolute Super Administrative permissions
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Administrative gateway permissions required.'
            ], 403);
        }

        $settings = SystemSetting::first();

        if (!$settings) {
            return response()->json([
                'success' => false,
                'message' => 'Workspace configuration variables initialized incorrectly.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'primary_color' => 'sometimes|required|string|max:12',
            'secondary_color' => 'sometimes|required|string|max:12',
            'allowed_file_types' => 'sometimes|required|array',
            'allowed_file_types.*' => 'string|max:10',
            'file_size_limit_mb' => 'sometimes|required|integer|min:5|max:500',
            'active_storage_provider' => 'sometimes|required|string|in:local,s3',
            'aws_s3_bucket' => 'nullable|string|max:220',
            'aws_s3_region' => 'nullable|string|max:100',
            'aws_access_key' => 'nullable|string|max:255',
            'aws_secret_key' => 'nullable|string|max:255',
            'enabled_modules' => 'sometimes|required|array',
            'enabled_modules.*' => 'string|in:properties,clearances,deadlines,penalties,analytics',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $settings->update($validator->validated());

        // Log operation on Audit Trail
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Modify Settings',
            'details' => "Updated regulatory sandbox limitations and enabled modules (" . implode(', ', $settings->enabled_modules) . "). Storage: {$settings->active_storage_provider}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Enterprise workspace settings updated successfully.',
            'settings' => $settings
        ]);
    }
}
