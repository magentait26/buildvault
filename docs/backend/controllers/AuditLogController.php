<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of system audit trails. Only accessible to Super Admins.
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking authorization keys to read enterprise audit ledgers.'
            ], 403);
        }

        $query = AuditLog::query();

        if ($request->filled('action_filter')) {
            $query->where('action', $request->input('action_filter'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'audit_logs' => $logs
        ]);
    }

    /**
     * Validate the entire audit trail integrity using cryptographic links check.
     */
    public function verifyTrailIntegrity(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('manage:settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking high-security cryptographic key authorization.'
            ], 403);
        }

        $allLogs = AuditLog::orderBy('created_at', 'asc')->get();
        $isChainHealthy = true;
        $failedRowIds = [];
        $expectedHash = null;

        foreach ($allLogs as $log) {
            // Verify link from previous row
            if ($expectedHash !== null && $log->previous_row_hash !== $expectedHash) {
                $isChainHealthy = false;
                $failedRowIds[] = $log->id;
            }

            // Calculate current row hash for the next record
            $payload = json_encode([
                'id' => $log->id,
                'user_id' => $log->user_id,
                'action' => $log->action,
                'details' => $log->details,
                'created_at' => $log->created_at,
            ]);

            $expectedHash = hash('sha256', $payload);
        }

        return response()->json([
            'success' => true,
            'integrity_check' => [
                'healthy' => $isChainHealthy,
                'total_verified_records' => $allLogs->count(),
                'corrupted_indices' => $failedRowIds,
                'timestamp' => now()->toIso8601String()
            ]
        ]);
    }
}
