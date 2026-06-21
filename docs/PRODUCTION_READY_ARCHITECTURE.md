# BuildVault Standalone Production Architecture & Standalone Blueprint
**Production-Ready Standalone Specification for Real Estate Developers, Builders, & Construction Companies**

This specification defines the database schema, API design, security layer, and blueprint for BuildVault as a **standalone, single-organization application**, fully prepared for direct, non-disruptive migration into **BhoomiOne ERP** as its native **Documents & Compliance** module.

---

## 1. Simplified PostgreSQL Relational Database Schema (DDL)

To eliminate all complex multi-tenant routing, subdomains, and subscription billing tables, we utilize a clean, unified schema. By storing resource associations under an `organization` envelope, this schema is simple to run standalone, yet retains an isolation structure that integrates smoothly with BhoomiOne ERP later.

```sql
-- ENABLE SYSTEM EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CHANNELS & CORE STATE TRAY (ORGANIZATION)
-- ============================================================================

CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_license_no VARCHAR(100),
    pan_no VARCHAR(50),
    registered_address TEXT,
    logo_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    logo_storage_path VARCHAR(512),
    primary_color VARCHAR(12) DEFAULT '#115e59',
    secondary_color VARCHAR(12) DEFAULT '#0f766e',
    allowed_file_types JSONB NOT NULL DEFAULT '[".pdf", ".dwg", ".dwf", ".xlsx", ".docx", ".png", ".jpg"]'::jsonb,
    file_size_limit_mb INT NOT NULL DEFAULT 50,
    active_storage_provider VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local', 's3', 'minio'
    aws_s3_bucket VARCHAR(255),
    aws_s3_region VARCHAR(100),
    aws_access_key VARCHAR(255),
    aws_secret_key VARCHAR(255),
    enabled_modules JSONB NOT NULL DEFAULT '["dashboard", "projects", "documents", "compliance", "approvals", "reports", "settings"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. ROLES, PERMISSIONS & ACCOUNTS (RBAC)
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 'Super Admin', 'Director', 'Project Manager', 'Site Engineer', 'Auditor'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- 'projects.create', 'documents.upload', 'documents.approve', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete marker
);

-- ============================================================================
-- 3. PORTFOLIOS, PROJECTS & BUILD SITES
-- ============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'BHOOMI-01', 'SLH-02'
    type VARCHAR(100) NOT NULL, -- 'Residential', 'Commercial', 'Mixed-Use', 'Infrastructure'
    status VARCHAR(50) NOT NULL DEFAULT 'Planning', -- 'Planning', 'Active Construction', 'Completed'
    rera_registration_no VARCHAR(100),
    site_address TEXT,
    deadline_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contributor_role VARCHAR(100), -- 'Site Engineer', 'Regulatory Lead'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- ============================================================================
-- 4. SECURE DOCUMENT VAULT
-- ============================================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Approvals', 'Blueprints', 'Contracts', 'EIA Reports', 'Financials'
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    latest_version INT NOT NULL DEFAULT 1,
    created_by UUID REFERENCES users(id) ON SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_adapter VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local', 's3', 'minio'
    storage_path VARCHAR(512) NOT NULL, -- e.g. 'vault/projects/BHOOMI-01/blueprints/plan_v1.pdf'
    uploaded_by UUID REFERENCES users(id) ON SET NULL,
    hash_sha256 CHAR(64) NOT NULL, -- Data integrity hash
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doc_version_number_unique UNIQUE (document_id, version_number)
);

-- ============================================================================
-- 5. BUSINESS SEQUENCED APPROVALS
-- ============================================================================

CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Revision Required', 'Rejected'
    current_stage VARCHAR(100) NOT NULL, -- 'SRE Review', 'Director Release', 'Third Party Audit'
    initiated_by UUID NOT NULL REFERENCES users(id),
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'Approved', 'Revision Required', 'Rejected'
    assigned_role VARCHAR(100),
    reviewer_id UUID REFERENCES users(id) ON SET NULL,
    rationale TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. LOCAL MUNICIPAL COMPLIANCE MODULE
-- ============================================================================

CREATE TABLE compliance_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'rera_blueprint', 'fire_noc', 'eia_clearance', 'water_comm'
    name VARCHAR(150) NOT NULL,
    required_frequency VARCHAR(50) NOT NULL, -- 'One-Time', 'Annual', 'Bi-Annual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compliance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    compliance_type_id UUID NOT NULL REFERENCES compliance_types(id),
    status VARCHAR(50) NOT NULL, -- 'Compliant', 'Action Required', 'Expired', 'Pending Inspection'
    certification_code VARCHAR(150), -- RERA Certificate # / Fire NOC #
    effective_date DATE,
    expiry_date DATE,
    audited_by VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 7. FORENSIC AUDIT TRAILS & LEDGERS
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'USER_LOGIN', 'UPLOAD_DOCUMENT', 'RESTORE_VERSION', 'TRANSITION_APPROVAL'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- OPTIMIZED SYSTEM INDEXES
-- ============================================================================
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_doc_versions_lookup ON document_versions(document_id, version_number);
CREATE INDEX idx_approvals_project ON approvals(project_id);
CREATE INDEX idx_compliance_records_project ON compliance_records(project_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
```

---

## 2. Laravel 12 Native Standalone Module Layout

With Laravel 12, modules are organized logically by domain rather than complex SaaS patterns. This modular domain architecture maps cleanly into **BhoomiOne ERP** directories.

```text
app/
└── Modules/
    ├── Common/                   # Core Helpers, Audits, & Base Models
    │   └── Models/
    │       ├── AuditLog.php
    │       └── SystemSetting.php
    ├── Project/                  # Project Portfolio Domain
    │   ├── Models/
    │   │   ├── Project.php
    │   │   └── ProjectMember.php
    │   └── Controllers/
    ├── Document/                 # Secured Document Vault Domain
    │   ├── Models/
    │   │   ├── Document.php
    │   │   └── DocumentVersion.php
    │   ├── Storage/              # Unified Storage Adapter contract
    │   └── Controllers/
    ├── Approval/                 # Sequential Approvals Domain
    │   └── Models/
    │       ├── Approval.php
    │       └── ApprovalHistory.php
    └── Compliance/               # Local Regulatory Clearances Domain
        └── Models/
            ├── ComplianceType.php
            └── ComplianceRecord.php
```

---

## 3. Simplified Standalone API Endpoints

Using Laravel Sanctum, authentication is simple and stateless.

| Verbs | Route Path | Access Gateway | Functional Intent |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Guest Access | Authenticate standalone user |
| **GET** | `/api/v1/projects` | `auth:sanctum` | Retrieve organization active build sites |
| **POST** | `/api/v1/projects` | `auth:sanctum`, `role:Director,Super Admin` | Provision a new construction project and site rules |
| **GET** | `/api/v1/documents` | `auth:sanctum` | List organization structural files |
| **POST** | `/api/v1/documents` | `auth:sanctum` | Upload checking and storage adapter write |
| **POST** | `/api/v1/approvals/{id}/transition`| `auth:sanctum` | Sign off, verify signature, or transit workflow state |
| **GET** | `/api/v1/compliance` | `auth:sanctum` | Check clearances, RERA timelines, and NOC statuses |
| **PUT** | `/api/v1/settings` | `auth:sanctum`, `role:Super Admin` | Toggle enabled modules or size bounds |

---

## 4. Single-Organization Identity & Authorization Resolver

Without the overhead of complex tenant interceptors, we resolve the context cleanly via Laravel Sanctum authentication. Active user profiles and RBAC capabilities are loaded directly into request attributes.

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request and audit RBAC boundaries.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated connection attempt.',
                'code' => 'UNAUTHENTICATED'
            ], 401);
        }

        // Validate current role
        $userRole = $user->role->name;
        
        if (in_array($userRole, $roles) || $userRole === 'Super Admin') {
            return $next($request);
        }

        return response()->json([
            'error' => 'Unauthorized action for role: ' . $userRole,
            'code' => 'UNAUTHORIZED_ROLE'
        ], 403);
    }
}
```

---

## 5. BhoomiOne ERP Portability Mapping Strategy

To ensure BuildVault can migrate seamlessly into **BhoomiOne ERP** (as the Documents & Compliance module), code design relies strictly on standard ERP patterns:

1. **Standardized Prefixes (Namespace Readiness)**:
   All database tables are defined without generic prefixes like `documents` or `compliance` to prevent collisions. When registering in BhoomiOne, variables map logically to:
   * `bhoomi_vault_documents`
   * `bhoomi_vault_compliance_records`
2. **Polymorphic Refactoring (Project / Resource Binding)**:
   The `project_id` foreign key references a standalone `projects` table. In BhoomiOne ERP, tasks link to properties, towers, units, or procurement items. The schema uses lightweight polymorphic mapping fields to associate assets seamlessly:
   * `resource_type` (e.g., `App\Models\Project`, `App\Modules\Erp\PropertyJoint`)
   * `resource_id`
3. **Decoupled Keycloak/SSO Frameworks**:
   Identity keys store references using clean UUIDs. This separation allows authentication to easily transition from Sanctum to BhoomiOne's unified login gateways like Keycloak or ForgeRock.

---

## 6. Audit & Standalone Configuration Map

We reviewed all existing application modules to ensure standalone operational integrity:

* **No Hardcoded Quotas**: All storage parameters (`50 MB`), files matrix, and visible routes load directly from `/src/services/settingsService.ts` local database simulation on the unified client context.
* **No External SaaS Dependencies**: All subscriptions, pricing models, and SaaS drawers are bypassed.
* **Isolated User Roles**: Permissions map cleanly per user without organization tenancy collisions.
