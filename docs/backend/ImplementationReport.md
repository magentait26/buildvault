# BuildVault Backend Foundation Sprint 01 Implementation Report

This report summarizes the database schema design, application structure, and API surface layouts implemented to support the **BuildVault** property compliance system on Laravel 12 and PostgreSQL. 

The generated workspace foundation is completely non-disruptive, highly standard, and conforms cleanly to security principles (SOC2 compliance targets, standard Eloquent design patterns, non-repudiation digital approvals, and complete immutable audit trails).

---

## 1. Directory Blueprint Map

All production-grade backend components have been structured and saved in the central `/docs/backend` repository:

```
/docs/backend/
├── migrations/
│   ├── 2026_06_17_000001_create_core_tables.php             # Core Users, Roles, Organizations, Settings Schema
│   └── 2026_06_17_000002_create_project_and_document_tables.php # Properties, Documents, Sign-offs, Audit Schema
├── models/
│   ├── User.php             # Authenticatable User with Sanctum & Relationship maps
│   ├── Role.php             # RBAC role declarations
│   ├── Permission.php       # Fine-grained ability mappings
│   ├── Project.php          # Physical site properties with RERA constraints
│   ├── Document.php         # Clearance category entries
│   ├── DocumentVersion.php  # Version file records (revisions history)
│   ├── Approval.php         # Secure digital signature sign-offs
│   ├── SystemSetting.php    # Active layout color & module controls
│   └── AuditLog.php         # SOC2 target immutable logs
├── controllers/
│   ├── AuthController.php   # Gateway Sanctum auth handler & profile metadata
│   ├── ProjectController.php # Property CRUD & business validations
│   ├── DocumentController.php # Physical file uploading & digital signatures
│   └── SettingsController.php # Administrative color, storage & layout parameters
├── routes/
│   └── api.php              # Sanctum-secured endpoint routing maps
├── seeders/
│   └── DatabaseSeeder.php   # Comprehensive default system seeder
└── ImplementationReport.md  # (This file) Executive design summary
```

---

## 2. Database Schema (PostgreSQL)

The database schema has been designed with strict referential integrity (using standard PostgreSQL data types and indexing optimized for high query loads):

1. **`organizations`**: Master list of corporate workspaces (supports cross-tenant scale).
2. **`system_settings`**: Stores customization parameters (logo path, theme colors, allowed file extensions, file size ceiling, and toggled modules grid).
3. **`roles` & `permissions`**: Implements many-to-many RBAC mappings matching Sanctum tokens abilities (`role_permissions` join table).
4. **`users`**: Features soft deletion, unique constraints, and foreign references to active roles.
5. **`projects`**: Models construction properties containing spatial parameters (locations, dates, RERA certification numbers).
6. **`documents`**: Parent register of specific compliance files belonging to projects.
7. **`document_versions`**: Maintains full modification history. Implements cryptographic file hashes (`sha256`) to ensure that file tampering is immediately caught.
8. **`approvals`**: High-compliance record of sign-offs. Stores a non-repudiation cryptographic string signature computed from the combined values of the file hash, approver's identity, and timestamp.
9. **`audit_logs`**: Holds system logs recording logins, configuration updates, and legal sign-off operations.

---

## 3. API Surface Layer & Routing Maps

All routes are fully authenticated via Laravel Sanctum middleware and enforce role-based resource permissions on controllers:

| Method | Endpoint | Required Capacities | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | None (Public) | Authenticates credentials, generates a Sanctum token, and appends permissions list. |
| **POST** | `/api/v1/auth/logout` | `auth:sanctum` | Revokes the current access token and securely logs out user. |
| **GET** | `/api/v1/auth/profile` | `auth:sanctum` | Fetches active login profile scopes. |
| **GET** | `/api/v1/projects` | `read:projects` | Lists physical properties and active timelines. |
| **POST** | `/api/v1/projects` | `write:projects` | Introduces new properties (validates RERA structures). |
| **GET** | `/api/v1/projects/{id}` | `read:projects` | Full property structural records. |
| **PUT** | `/api/v1/projects/{id}` | `write:projects` | Edits properties fields and status markers. |
| **DELETE** | `/api/v1/projects/{id}` | `delete:projects` | Soft deletes property records. |
| **GET** | `/api/v1/documents` | `read:documents` | Lists clearance certificates and expirations. |
| **POST** | `/api/v1/documents` | `write:documents` | Uploads compliance files (limits checked via settings). |
| **POST** | `/api/v1/documents/{id}/approve`| `approve:documents` | Signs/Rejects clearance requests with security hashes. |
| **GET** | `/api/v1/settings` | `auth:sanctum` | View Active corporate style guidelines & modular variables. |
| **PUT** | `/api/v1/settings` | `manage:settings` | Modifies active features (colors, file limits, services). |

---

## 4. Operational Role Mappings

The system utilizes five core operational roles that synchronize automatically with your frontend structures:

1. **Super Admin**: High-privilege setup controller. Holds all access categories (`read/write/delete:projects`, `read/write/approve:documents`, `manage:settings`).
2. **Director**: Full executive authority. Authorized to sign statutory filings and approve documents (`read/write:projects`, `read/write/approve:documents`).
3. **Project Manager**: Pipeline execution lead. Oversees timelines and compiles clearance requests (`read/write:projects`, `read/write:documents`).
4. **Compliance Officer**: Regulatory auditor. Authorized to upload audit reviews and approve clearances (`read:projects`, `read/write/approve:documents`).
5. **Site Engineer**: Practical field expert. Registers inspections files and surveys (`read:projects`, `read/write:documents`).

---

## 5. Security & SOC-2 Compliance Goals

To preserve highest institutional credibility, the backend foundation actively implements:
- **Immutable Audit Logging**: Every critical operation (logins, settings edits, clearance uploads, non-repudiation approvals) writes directly into the `audit_logs` table.
- **Cryptographic File Assurance**: Files processed register a cryptographic signature. Before sign-off, system administrators can verify database hashes against physical files to prevent payload injection or silent replacement.
- **Strict Least Privilege Principles**: Sanctum tokens strictly contain token abilities matching roles permissions, verified on the API gateway before executing controllers logic.
