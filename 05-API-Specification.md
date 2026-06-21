# BuildVault — RESTful API Specification (V1 Core)

**Document ID:** BV-API-05  
**Author:** Senior Laravel API Architect  
**Date:** June 15, 2026  
**Status:** Approved for Core Engineering Implementation  
**Version:** 1.0.0  

---

This document outlines the RESTful API specification for the **BuildVault** engine. All endpoints route through an API gateway layer with authentication, rate-limiting, and tenant context parsing middleware.

---

## 1. Global API Standards

*   **API Base URL:** `https://{tenant_subdomain}.buildvault.com/api/v1`
*   **Media Types:** Requests and responses must utilize `application/json` payloads.
*   **Rate Limiting:** IP-based and authenticated user-based rate limits are enforced via Redis token bucket buffers:
    *   *Standard Endpoints:* 60 requests per minute.
    *   *Upload Initiations:* 10 requests per minute.
    *   *Authentication Endpoints:* 5 IP requests per minute.
*   **Universal Header Requirements:**
    *   `Authorization: Bearer {SUPABASE_JWT_ACCESS_TOKEN}`
    *   `Content-Type: application/json`
    *   `Accept: application/json`

---

## 2. Standard Error Response Schemas

To ensure client stability, all non-2xx failures must return standardized JSON payloads:

### 400 Bad Request
```json
{
  "error": "Invalid payload values provided.",
  "code": "BAD_REQUEST",
  "details": {
    "file_size": ["The document file size cannot exceed 100MB."]
  }
}
```

### 401 Unauthenticated
```json
{
  "error": "The authorization signature is expired or empty.",
  "code": "UNAUTHENTICATED"
}
```

### 403 Access Denied (RBAC / Tenants Violation)
```json
{
  "error": "You do not hold permissions to read this document context.",
  "code": "FORBIDDEN"
}
```

---

## 3. Module Endpoint Specifications

### 3.1 Authentication APIs

Authentication processes are handled via Client federations using the **Supabase Auth SDK**. However, Laravel provides dynamic hook endpoints to register identity schemas on first access or to synchronize user metrics.

#### 1. POST `/auth/sync-session`
*   **Purpose:** Synchronize active federated Supabase JWT metadata and verify local user account provisions on client startup.
*   **Auth Requirement:** `Bearer Supabase JWT` (Universal Access)
*   **Header Rules:** `Accept: application/json`
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    {
      "synced": true,
      "user": {
        "id": "c1685789-fe8c-4065-9ec6-7b8b5b732801",
        "name": "Devon Carter",
        "email": "devon.carter@abcbuilders.com",
        "status": "Active",
        "organization": {
          "id": "org-2983-cf293",
          "name": "ABC Builders Pvt Ltd",
          "subdomain": "abcbuilders"
        },
        "assigned_roles": [
          {
            "role": "Director",
            "project_id": null
          }
        ]
      }
    }
    ```

---

### 3.2 Organizations (Tenant Administration) APIs

These endpoints are used by Owner roles or global system administrators to coordinate organizational scopes and billing records.

#### 1. GET `/organization`
*   **Purpose:** Retrieve organizational tenant metadata, metadata counts, and active billing tiers.
*   **Auth Requirement:** Token-Based (Requires role `Owner` or `Admin`)
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    {
      "organization": {
        "id": "org-2983-cf293",
        "name": "ABC Builders Pvt Ltd",
        "domain_subprefix": "abcbuilders",
        "gst_number": "29ABCDE1234F1Z5",
        "billing_email": "billing@abcbuilders.in",
        "status": "Active",
        "storage_utilized_bytes": 1932784560,
        "storage_cap_bytes": 5497558138880,
        "created_at": "2026-03-01T12:00:00Z"
      }
    }
    ```

#### 2. PATCH `/organization`
*   **Purpose:** Update basic organization parameters.
*   **Auth Requirement:** Token-Based (Requires role `Owner` exclusively)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'name' => 'sometimes|string|max:255',
        'gst_number' => 'sometimes|nullable|string|size:15',
        'billing_email' => 'sometimes|email|max:254'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "name": "ABC Builders & Infra Pvt Ltd",
      "gst_number": "29ABCDE1234F1Z9"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Organization metrics modified successfully.",
      "updated_fields": {
        "name": "ABC Builders & Infra Pvt Ltd",
        "gst_number": "29ABCDE1234F1Z9"
      }
    }
    ```

---

### 3.3 Projects Pipeline APIs

Enables developers to configure, monitor, scale, and inspect construction pipelines.

#### 1. GET `/projects`
*   **Purpose:** Retrieve real estate and infrastructure projects in the tenant namespace. Supports filtration by status.
*   **Auth Requirement:** Basic Token-Based (Universal workspace role access)
*   **Query Parameters:**
    *   `status`: Optional String (Options: `Planning`, `In_Progress`, `On_Hold`, `Completed`)
*   **Response (250 OK):**
    ```json
    [
      {
        "id": "p-9283-abc",
        "name": "Azure Heights",
        "status": "In_Progress",
        "completion_percentage": 62.00,
        "compliance_percentage": 88.00,
        "lead_name": "Priya Menon",
        "created_at": "2026-01-10T08:30:00Z"
      }
    ]
    ```

#### 2. POST `/projects`
*   **Purpose:** Create a brand new project scope.
*   **Auth Requirement:** Token-Based (Requires role `Owner` or `Admin`)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'name' => 'required|string|max:255|unique_inside_tenant:projects,name',
        'lead_name' => 'required|string|max:150',
        'status' => 'required|in:Planning,In_Progress,On_Hold,Completed'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "name": "Lakeside Residences",
      "lead_name": "Anand Pillai",
      "status": "Planning"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "p-1029-xyz",
      "name": "Lakeside Residences",
      "status": "Planning",
      "completion_percentage": 0.00,
      "compliance_percentage": 100.00,
      "lead_name": "Anand Pillai",
      "created_at": "2026-06-15T02:30:00Z"
    }
    ```

---

### 3.4 Documents & Versioning APIs

Tracks file layouts, processes uploads via AWS S3 presigned PUT links, and registers metadata version steps.

#### 1. GET `/projects/{project_id}/documents`
*   **Purpose:** Retrieve structural documents linked to a construction project, filtered by categories.
*   **Auth Requirement:** Token-Based (Universal Access)
*   **Query Parameters:**
    *   `category`: Optional String (Options: `Land Records`, `Legal`, `RERA`, `Approvals`, `Construction`, etc.)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "doc-81726",
        "name": "Structural Drawing Rev 4 - Tower B.pdf",
        "category": "Construction",
        "status": "In_Review",
        "current_version": 4,
        "uploaded_by": {
          "id": "u-29831",
          "name": "Priya Menon"
        },
        "created_at": "2026-06-10T11:00:00Z"
      }
    ]
    ```

#### 2. POST `/projects/{project_id}/documents/upload-intent`
*   **Purpose:** Declare intent to upload a document file. Secures an authenticated S3 presigned PUT address.
*   **Auth Requirement:** Token-Based (Requires `Owner`, `Admin`, `Project Head`, or `Site Engineer`)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'name' => 'required|string|max:255',
        'category' => 'required|string|in:Land Records,Legal,RERA,Approvals,Construction,Finance,Contracts',
        'file_name' => 'required|string|max:255',
        'file_size' => 'required|integer|max:104857600', -- Max 100MB
        'file_checksum_sha256' => 'required|string|size:64'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "name": "Fire NOC Permit v2",
      "category": "RERA",
      "file_name": "fire_noc_permit.pdf",
      "file_size": 1249301,
      "file_checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "upload_token_id": "upt-9283-abc728",
      "target_upload_presigned_url": "https://buildvault-prod-storage-bucket.s3.ap-south-1.amazonaws.com/tenant-1/p-9283-abc/RERA/fire_noc_permit.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900...",
      "s3_storage_key": "tenant-1/p-9283-abc/RERA/fire_noc_permit.pdf"
    }
    ```

#### 3. POST `/projects/{project_id}/documents/upload-complete`
*   **Purpose:** Confirm that the binary asset was successfully uploaded directly to S3. This step indexes the metadata record.
*   **Auth Requirement:** Token-Based (Requires same role executing intent)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'upload_token_id' => 'required|string',
        's3_storage_key' => 'required|string'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "upload_token_id": "upt-9283-abc728",
      "s3_storage_key": "tenant-1/p-9283-abc/RERA/fire_noc_permit.pdf"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "document_id": "doc-9281-c72",
      "version_id": "ver-102-abc",
      "name": "Fire NOC Permit v2",
      "category": "RERA",
      "status": "In_Review",
      "version_number": 1,
      "s3_key": "tenant-1/p-9283-abc/RERA/fire_noc_permit.pdf",
      "created_at": "2026-06-15T02:37:00Z"
    }
    ```

#### 4. GET `/documents/{document_id}/download-url`
*   **Purpose:** Retrieve a dynamic read presigned S3 url enabling authenticated file lookup. URL expires in 10 minutes.
*   **Auth Requirement:** Token-Based (Universal scope; mapped to category RBAC restrictions)
*   **Response (200 OK):**
    ```json
    {
      "document_id": "doc-9281-c72",
      "presigned_download_url": "https://buildvault-prod-storage-bucket.s3.ap-south-1.amazonaws.com/tenant-1/p-9283-abc/RERA/fire_noc_permit.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=600..."
    }
    ```

---

### 3.5 Compliance Checklists APIs

Tracks certifications, warns liaison coordinators of pending expirations, and logs validation proofs.

#### 1. GET `/projects/{project_id}/compliance`
*   **Purpose:** Fetch the compliance index tracker representing the target construction site.
*   **Auth Requirement:** Token-Based (Universal access)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "comp-7182",
        "title": "Fire NOC",
        "status": "Expiring",
        "expiry_date": "2026-07-03",
        "warning_buffer_days": 30,
        "days_remaining": 18,
        "attachment_s3_key": "tenant-1/p-9283-abc/comply/fire_noc.pdf"
      }
    ]
    ```

---

### 3.6 Approvals Workflows APIs

Orchestrates formal sequential or concurrent document sign-offs across engineering departments.

#### 1. POST `/approvals`
*   **Purpose:** Initiate an approval pipeline for an uploaded blueprint or contract file.
*   **Auth Requirement:** Token-Based (Requires `Owner`, `Admin`, `Project Head`, `Legal`, or `Finance`)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'document_id' => 'required|uuid|exists:documents,id',
        'priority' => 'required|in:Low,Medium,High',
        'approver_ids' => 'required|array|min:1',
        'approver_ids.*' => 'required|uuid|exists:users,id'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "document_id": "doc-81726",
      "priority": "High",
      "approver_ids": [
        "u-1203-director",
        "u-9281-legal"
      ]
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "approval_id": "apv-1029-abc",
      "document_id": "doc-81726",
      "priority": "High",
      "status": "Pending",
      "stages": [
        {
          "approver_id": "u-1203-director",
          "status": "Pending",
          "signed_at": null
        },
        {
          "approver_id": "u-9281-legal",
          "status": "Pending",
          "signed_at": null
        }
      ],
      "created_at": "2026-06-15T02:37:30Z"
    }
    ```

#### 2. POST `/approvals/{approval_id}/sign`
*   **Purpose:** Submit a signature decision: Approve, Request Changes, or Reject.
*   **Auth Requirement:** Token-Based (Requires specified recipient approver token context)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'decision' => 'required|in:Approved,Requires_Changes,Rejected',
        'rejection_reason' => 'required_if:decision,Requires_Changes,Rejected|string|max:1000'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "decision": "Approved",
      "rejection_reason": null
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "approval_id": "apv-1029-abc",
      "my_stage_id": "sg-9281-abc",
      "status": "Approved",
      "signed_out_at": "2026-06-15T02:38:00Z",
      "pipeline_complete": false
    }
    ```

---

### 3.7 Notifications & In-App Alerts APIs

Informs on-site operations teams across devices of incoming approval decisions or compliance warnings.

#### 1. GET `/notifications`
*   **Purpose:** Query the logged in user's active notification dispatch index.
*   **Auth Requirement:** Token-Based (Universal scope targeting current session ID)
*   **Query Parameters:**
    *   `unread_only`: Optional Boolean (Options: `true`, `false`)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "not-11202",
        "title": "Approval required: Tower B Structural Rev 4",
        "message": "Azure Heights • High priority",
        "priority": "High",
        "event_type": "pending_approval",
        "is_read": false,
        "created_at": "2026-06-15T02:35:00Z"
      }
    ]
    ```

#### 2. PUT `/notifications/mark-read`
*   **Purpose:** Mark one or all received workspace notifications as read.
*   **Auth Requirement:** Token-Based
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'notification_ids' => 'sometimes|array',
        'notification_ids.*' => 'uuid|exists:notifications,id',
        'all' => 'required_without:notification_ids|boolean'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "all": true
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "marked": true,
      "count": 12
    }
    ```

---

### 3.8 Users & Team Onboarding APIs

Manages team profiles, invites site engineers, and monitors active operational roles.

#### 1. GET `/users`
*   **Purpose:** Read workspace accounts, active states, and role assignments in the current tenant.
*   **Auth Requirement:** Token-Based (Universal access)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "u-29831",
        "name": "Priya Menon",
        "email": "priya@abcbuilders.com",
        "role": "Project Manager",
        "status": "Active"
      },
      {
        "id": "u-1029",
        "name": "Divya Nair",
        "email": "divya@abcbuilders.com",
        "role": "Finance Team",
        "status": "Invited"
      }
    ]
    ```

#### 2. POST `/users/invite`
*   **Purpose:** Issue an invite link to register a new employee. Creates user and role indices.
*   **Auth Requirement:** Token-Based (Requires `Owner` or `Admin`)
*   **Request Validation Rules (Laravel Style):**
    ```php
    [
        'name' => 'required|string|max:150',
        'email' => 'required|email|max:254|unique_inside_tenant:users,email',
        'role' => 'required|string|in:Admin,Project Manager,Site Engineer,Legal Team,Finance Team,Auditor',
        'project_id' => 'required_if:role,Project Manager,Site Engineer|nullable|uuid|exists:projects,id'
    ]
    ```
*   **Request Body:**
    ```json
    {
      "name": "Sanjay Kapoor",
      "email": "sanjay@external.com",
      "role": "Auditor",
      "project_id": null
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "u-1092-xyz",
      "name": "Sanjay Kapoor",
      "email": "sanjay@external.com",
      "role": "Auditor",
      "status": "Invited",
      "invitation_link": "https://abcbuilders.buildvault.com/onboard?invite_token=9283abc...",
      "created_at": "2026-06-15T02:38:30Z"
    }
    ```
