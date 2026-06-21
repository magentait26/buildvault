<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DocumentVersionController extends Controller
{
    /**
     * List historical revisions for a regulatory document.
     */
    public function index(string $documentId): JsonResponse
    {
        $document = Document::find($documentId);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Clearance document register missing.'
            ], 404);
        }

        $versions = DocumentVersion::with('publisher')
            ->where('document_id', $documentId)
            ->orderBy('version_number', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'versions' => $versions
        ]);
    }

    /**
     * Increment document versions with standard payload uploads under logical scopes.
     */
    public function store(Request $request, string $documentId): JsonResponse
    {
        if (!$request->user()->tokenCan('write:documents')) {
            return response()->json([
                'success' => false,
                'message' => 'Lacking authorization keys to write/alter records.'
            ], 403);
        }

        $document = Document::find($documentId);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Parent document declaration target not found.'
            ], 404);
        }

        $settings = SystemSetting::first();
        $allowedExts = $settings ? implode(',', $settings->allowed_file_types) : 'pdf,dwg,zip,jpg,png,docx';
        $maxSizeLimitKb = $settings ? ($settings->file_size_limit_mb * 1024) : 51200; // default 50MB

        $validator = Validator::make($request->all(), [
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

        // Calculate storage paths
        $storageProvider = $settings->active_storage_provider ?? 'local';
        $path = $uploadedFile->storeAs(
            'documents/' . $document->project_id,
            Str::uuid() . '_' . $fileName,
            $storageProvider === 's3' ? 's3' : 'public'
        );

        $fileHash = hash_file('sha256', $uploadedFile->getRealPath());

        // Recalculate revision number sequence
        $latestVersionNo = DocumentVersion::where('document_id', $documentId)->max('version_number') ?? 1;
        $nextVersionNo = $latestVersionNo + 1;

        $version = DocumentVersion::create([
            'document_id' => $documentId,
            'uploaded_by_user_id' => $request->user()->id,
            'version_number' => $nextVersionNo,
            'file_name' => $fileName,
            'storage_path' => $path,
            'file_hash' => $fileHash,
            'file_size_bytes' => $fileSize,
        ]);

        // Elevate parent version meta
        $document->update([
            'current_version' => $nextVersionNo,
            'status' => 'Awaiting Approval' // Reset compliance status for re-evaluation
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role->name,
            'action' => 'Upload Revision',
            'details' => "Pushed updated revision #{$nextVersionNo} for document '{$document->title}' (ID: {$documentId}). SHA256 Verification: {$fileHash}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Uploaded new version revision successfully.',
            'version' => $version,
            'document' => $document
        ], 201);
    }
}
