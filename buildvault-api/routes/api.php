<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentVersionController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\ApprovalController;
use App\Http\Controllers\Api\V1\ComplianceRecordController;
use App\Http\Controllers\Api\V1\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| BuildVault Laravel 12 API Routes
|--------------------------------------------------------------------------
*/

// Public Entrance 
Route::post('/v1/auth/login', [AuthController::class, 'login'])->name('api.login');

// Sanctum Protected Scope
Route::middleware(['auth:sanctum'])->group(function () {

    // Authenticated Profiles Gates
    Route::get('/v1/auth/profile', [AuthController::class, 'profile'])->name('api.profile');
    Route::post('/v1/auth/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Users & Identity controls
    Route::prefix('v1/users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::get('/{id}', [UserController::class, 'show'])->name('users.show');
        Route::put('/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Roles & Fine-grained RBAC mappings
    Route::prefix('v1/roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
    });

    // Projects (Real Estate / Construction Sites)
    Route::prefix('v1/projects')->group(function () {
        Route::get('/', [ProjectController::class, 'index'])->name('projects.index');
        Route::post('/', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('/{id}', [ProjectController::class, 'show'])->name('projects.show');
        Route::put('/{id}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/{id}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    });

    // Documents & Statutory Clearance Registries
    Route::prefix('v1/documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index'])->name('documents.index');
        Route::post('/', [DocumentController::class, 'store'])->name('documents.store');
        Route::put('/{id}', [DocumentController::class, 'update'])->name('documents.update');
        Route::post('/{id}/approve', [DocumentController::class, 'approve'])->name('documents.approve');
        Route::patch('/{id}/archive', [DocumentController::class, 'archive'])->name('documents.archive');
        Route::patch('/{id}/restore', [DocumentController::class, 'restore'])->name('documents.restore');
        Route::delete('/{id}', [DocumentController::class, 'destroy'])->name('documents.destroy');
        
        // Document versions history revisions
        Route::get('/{id}/versions', [DocumentVersionController::class, 'index'])->name('documents.versions.index');
        Route::post('/{id}/versions', [DocumentVersionController::class, 'store'])->name('documents.versions.store');
    });

    // Compliance Checklists (RERA deadlines, structural NOCs)
    Route::prefix('v1/compliance-records')->group(function () {
        Route::get('/', [ComplianceRecordController::class, 'index'])->name('compliance.index');
        Route::post('/', [ComplianceRecordController::class, 'store'])->name('compliance.store');
        Route::put('/{id}', [ComplianceRecordController::class, 'update'])->name('compliance.update');
        Route::delete('/{id}', [ComplianceRecordController::class, 'destroy'])->name('compliance.destroy');
    });

    // Compliances Approvals orchestrations
    Route::prefix('v1/approvals')->group(function () {
        Route::get('/', [ApprovalController::class, 'index'])->name('approvals.index');
        Route::post('/', [ApprovalController::class, 'store'])->name('approvals.store');
        Route::post('/{id}/comments', [ApprovalController::class, 'comment'])->name('approvals.comment');
    });

    // Enterprise System configuration
    Route::prefix('v1/settings')->group(function () {
        Route::get('/', [SettingsController::class, 'show'])->name('settings.show');
        Route::put('/', [SettingsController::class, 'update'])->name('settings.update');
    });

    // Audit trails ledgers
    Route::prefix('v1/audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])->name('audit.index');
        Route::post('/verify-integrity', [AuditLogController::class, 'verifyTrailIntegrity'])->name('audit.verify');
    });

});
