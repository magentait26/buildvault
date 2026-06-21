<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\ApprovalComment;
use App\Models\ApprovalSignOff;
use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ApprovalController extends Controller
{
    /**
     * Display a paginated listing of organizational approval orchestrations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Approval::with(['document.latestVersion', 'approvals.approver', 'comments.user']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $approvals = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'approvals' => $approvals
        ]);
    }

    /**
     * Dispatch/initiate an official document sign-off sequence on the builder's pipeline.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('write:documents')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking authorization token privileges to initiate verification.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'document_id' => 'required|uuid|exists:documents,id',
            'priority' => 'required|string|in:Low,Medium,High',
            'approver_ids' => 'required|array|min:1',
            'approver_ids.*' => 'uuid|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $document = Document::find($request->input('document_id'));
        $document->update(['status' => 'In_Review']);

        $approval = Approval::create([
            'document_id' => $request->input('document_id'),
            'initiated_by_uid' => $request->user()->id,
            'priority' => $request->input('priority'),
            'status' => 'Pending',
        ]);

        // Establish reviewers tracks
        foreach ($request->input('approver_ids') as $approverId) {
            ApprovalSignOff::create([
                'id' => (string) Str::uuid(),
                'approval_id' => $approval->id,
                'approver_user_id' => $approverId,
                'status' => 'Pending',
            ]);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Initiate Verification',
            'details' => "Dispatched official verification request for document '{$document->title}' (ID: {$document->id}) with " . count($request->input('approver_ids')) . " designated reviewers.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compliance approval process dispatched.',
            'approval' => $approval->load(['approvals.approver', 'document'])
        ], 201);
    }

    /**
     * Submit comments or explanations inside active sign-off threads.
     */
    public function comment(Request $request, string $id): JsonResponse
    {
        $approval = Approval::find($id);

        if (!$approval) {
            return response()->json([
                'success' => false,
                'message' => 'Verification sequence log does not exist.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $comment = ApprovalComment::create([
            'approval_id' => $id,
            'user_id' => $request->user()->id,
            'comment' => $request->input('comment'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment appended to approval thread.',
            'comment' => $comment->load('user')
        ], 201);
    }
}
