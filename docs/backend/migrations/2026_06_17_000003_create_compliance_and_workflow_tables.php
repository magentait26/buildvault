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
        // 1. Approval Review Sign-off Tracks
        Schema::create('approval_sign_offs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('approval_id');
            $table->uuid('organization_id');
            $table->uuid('approver_user_id');
            $table->string('status', 30)->default('Pending'); // Pending, Approved, Requires_Changes, Rejected
            $table->text('rejection_reason')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();

            $table->unique(['approval_id', 'approver_user_id']);
            $table->foreign('approval_id')->references('id')->on('approvals')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('approver_user_id')->references('id')->on('users')->onDelete('restrict');
        });

        // 2. Approval Threaded Feedback Channel Comments
        Schema::create('approval_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('approval_id');
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->text('comment');
            $table->timestamps();

            $table->foreign('approval_id')->references('id')->on('approvals')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Compliance Checklists / Records (RERA, NOCs, Permits)
        Schema::create('compliance_checklists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('project_id');
            $table->string('title');
            $table->string('status', 30)->default('Pending'); // Complete, Pending, Expiring, Missing
            $table->date('expiry_date');
            $table->integer('warning_buffer_days')->default(30);
            $table->string('attachment_s3_key', 1024)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['project_id', 'title']);
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // 4. Notifications dispatch register
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->string('title');
            $table->text('message');
            $table->string('priority', 20)->default('Medium'); // Low, Medium, High
            $table->string('event_type', 100); // e.g. pending_approval, compliance_near_expiry
            $table->string('target_action_url', 500)->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 5. Integrations configuration parameters
        Schema::create('integrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('service_provider', 50); // DigiLocker, eSign, WhatsApp, etc.
            $table->boolean('is_active')->default(true);
            $table->binary('payload_credentials'); // Encrypted keys/secret blob
            $table->timestamps();

            $table->unique(['organization_id', 'service_provider']);
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('compliance_checklists');
        Schema::dropIfExists('approval_comments');
        Schema::dropIfExists('approval_sign_offs');
    }
};
