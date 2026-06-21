<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Projects/Properties
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('location');
            $table->date('start_date');
            $table->date('handover_date')->nullable();
            $table->string('status', 30)->default('Active'); // Planning, Active, Completed, On Hold, Archived
            $table->float('rera_registration_no')->nullable(); // RERA number placeholder
            $table->string('rera_registration_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Many-to-Many Project Team assignments
        Schema::create('project_user', function (Blueprint $table) {
            $table->uuid('project_id');
            $table->uuid('user_id');
            $table->primary(['project_id', 'user_id']);

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 2. Clearances & Documents
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('title');
            $table->string('category', 60); // e.g., Fire Safety, Title Deeds, Environmental, Structural Stability
            $table->string('status', 40)->default('Awaiting Approval'); // Approved, Rejected, Action Required, Awaiting Approval, Expired
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // Log of revisions for audit logs & reversion support
        Schema::create('document_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('document_id');
            $table->uuid('uploaded_by_user_id');
            $table->integer('version_number')->default(1);
            $table->string('file_name');
            $table->string('storage_path', 512);
            $table->string('file_hash')->nullable();
            $table->bigInteger('file_size_bytes');
            $table->timestamps();

            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->foreign('uploaded_by_user_id')->references('id')->on('users');
        });

        // 3. Official Sign-offs/Approvals
        Schema::create('approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('document_id');
            $table->uuid('approved_by_user_id');
            $table->string('status', 20)->default('Approved'); // Approved, Rejected
            $table->text('comments')->nullable();
            $table->string('digital_signature_hash')->nullable(); // Standard non-repudiation signature
            $table->timestamp('signed_at')->useCurrent();

            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->foreign('approved_by_user_id')->references('id')->on('users');
        });

        // 4. Audit Log
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('action'); // Create Document, Sign Clearance, etc.
            $table->text('details')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('approvals');
        Schema::dropIfExists('document_versions');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('project_user');
        Schema::dropIfExists('projects');
    }
};
