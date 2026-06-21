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
        // 1. Organization & Core Settings
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('trade_license_no')->nullable();
            $table->string('pan_no')->nullable();
            $table->text('registered_address')->nullable();
            $table->string('logo_url', 512)->nullable();
            $table->timestamps();
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('logo_storage_path', 512)->nullable();
            $table->string('primary_color', 12)->default('#115e59');
            $table->string('secondary_color', 12)->default('#0f766e');
            $table->json('allowed_file_types');
            $table->integer('file_size_limit_mb')->default(50);
            $table->string('active_storage_provider', 50)->default('local');
            $table->string('aws_s3_bucket')->nullable();
            $table->string('aws_s3_region')->nullable();
            $table->string('aws_access_key')->nullable();
            $table->string('aws_secret_key')->nullable();
            $table->json('enabled_modules');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 2. Roles & Permissions (RBAC)
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->primary(['role_id', 'permission_id']);

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
        });

        // 3. User Accounts with Soft Deletes
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('role_id');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('avatar_url', 512)->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('role_id')->references('id')->on('roles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('organizations');
    }
};
