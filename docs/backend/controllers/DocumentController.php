<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Retrieve global document clearances with sorting and filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Document::query()->with(['latestVersion.publisher', 'project', 'approvals.approver']);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $documents = $query->orderBy('updated_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'documents' => $documents
        ]);
    }

    /**
     * Store/upload a new legal clearance document.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->tokenCan('write:documents')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking direct upload capabilities.'
            ], 403);
        }

        // Retrieve compliance limits from system settings
        $settings = SystemSetting::first();
        $allowedExts = $settings ? implode(',', $settings->allowed_file_types) : 'pdf,dwg,zip,jpg,png,docx';
        $maxSizeLimitKb = $settings ? ($settings->file_size_limit_mb * 1024) : 51200; // default 50MB

        $validator = Validator::make($request->all(), [
            'project_id' => 'required|uuid|exists:projects,id',
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'expiry_date' => 'nullable|date',
            'file' => "required|file|mimes:{$allowedExts}|max:{$maxSizeLimitKb}",
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $uploadedFile = $request->file('file');
        $fileName = $uploadedFile->getClientOriginalName();
        $fileSize = $uploadedFile->getSize();

        // Safe storage path calculation (e.g., S3 or Local)
        $storageProvider = $settings->active_storage_provider ?? 'local';
        $path = $uploadedFile->storeAs(
            'documents/' . $request->input('project_id'),
            Str::uuid() . '_' . $fileName,
            $storageProvider === 's3' ? 's3' : 'public'
        );

        // Calculate cryptographic hash for document version integrity / revision audit trail
        $fileHash = hash_file('sha256', $uploadedFile->getRealPath());

        // Create document parent register
        $document = Document::create([
            'project_id' => $request->input('project_id'),
            'title' => $request->input('title'),
            'category' => $request->input('category'),
            'expiry_date' => $request->input('expiry_date'),
            'status' => 'Awaiting Approval',
        ]);

        // Establish original revision 1
        $version = DocumentVersion::create([
            'document_id' => $document->id,
            'uploaded_by_user_id' => $request->user()->id,
            'version_number' => 1,
            'file_name' => $fileName,
            'storage_path' => $path,
            'file_hash' => $fileHash,
            'file_size_bytes' => $fileSize,
        ]);

        // Log operation to Audit Trail
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Upload Clearance',
            'details' => "Uploaded statutory file '{$fileName}' (Size: " . round($fileSize / 1024 / 1024, 2) . " MB) into project index. Generated File Integrity SHA256: {$fileHash}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded for physical compliance check.',
            'document' => $document->load('latestVersion')
        ], 201);
    }

    /**
     * Clearance authorize or reject a statutory request (Digital sign-off).
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        if (!$request->user()->tokenCan('approve:documents')) {
            return response()->json([
                'success' => false,
                'message' => 'High-security approval/sign-off keys missing.'
            ], 403);
        }

        $document = Document::with('latestVersion')->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Target clearance document missing.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:Approved,Rejected,Action Required',
            'comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Simulate digital physical key sign-off hash for legal non-repudiation
        $signaturePayload = json_encode([
            'document_id' => $id,
            'file_hash' => $document->latestVersion->file_hash ?? 'N/A',
            'signed_by_email' => $request->user()->email,
            'timestamp' => now()->toIso8601String(),
        ]);
        $digitalSignatureHash = hash_hmac('sha256', $signaturePayload, config('app.key'));

        $status = $request->input('status');

        $document->update(['status' => $status]);

        // Store Official Audit approval certificate
        $approval = Approval::create([
            'document_id' => $document->id,
            'approved_by_user_id' => $request->user()->id,
            'status' => $status === 'Approved' ? 'Approved' : 'Rejected',
            'comments' => $request->input('comments'),
            'digital_signature_hash' => $digitalSignatureHash,
            'signed_at' => now(),
        ]);

        // Audit Trail
        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Sign Clearance',
            'details' => "Dispatched statutory approval sign-off. Status: {$status} for document '{$document->title}' (ID: {$id}). Certificate Hash: {$digitalSignatureHash}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Clearance request successfully marked as {$status}.",
            'approval_certificate' => [
                'id' => $approval->id,
                'status' => $approval->status,
                'signed_by' => $request->user()->name,
                'time' => $approval->signed_at,
                'digital_signature_hash' => $digitalSignatureHash,
            ]
        ]);
    }
}
