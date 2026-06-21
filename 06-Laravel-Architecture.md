# BuildVault — Enterprise Laravel 12 Backend Implementation Architecture

**Document ID:** BV-LAR-06  
**Author:** Laravel 12 Enterprise Architect  
**Date:** June 15, 2026  
**Status:** Approved for Core Development  
**Version:** 1.0.0  

---

This document outlines the directory structure, design patterns, core class declarations, and event-driven patterns supporting BuildVault’s Laravel 12 backend engine. It establishes enterprise integration patterns for queues, job dispatching, model policies, and security isolation layers.

---

## 1. Domain-Driven Directory Structure (DDD Style)

BuildVault uses a Domain-Driven Design (DDD) layout to decouple modules. This ensures the application scales smoothly without cluttering standard controllers and models.

```
app/
├── Console/
│   └── Commands/
│       └── MonitorComplianceExpirations.php    # Hourly compliance warning tracker
├── Domains/                                     # Domain-Driven Core Modules
│   ├── ProjectManagement/
│   │   ├── Models/
│   │   │   └── Project.php
│   │   ├── Controllers/
│   │   │   └── ProjectController.php
│   │   ├── Services/
│   │   │   └── ProjectProvisioningService.php
│   │   └── Repositories/
│   │       └── ProjectRepositoryInterface.php
│   ├── DocumentControl/
│   │   ├── Models/
│   │   │   ├── Document.php
│   │   │   └── DocumentVersion.php
│   │   ├── Controllers/
│   │   │   └── DocumentController.php
│   │   ├── Services/
│   │   │   └── S3StorageService.php
│   │   ├── Policies/
│   │   │   └── DocumentPolicy.php
│   │   └── Events/
│   │       └── DocumentUploaded.php
│   ├── ApprovalsEngine/
│   │   ├── Models/
│   │   │   ├── Approval.php
│   │   │   └── ApprovalSignOff.php
│   │   ├── Services/
│   │   │   └── SignOffWorkflowManager.php
│   │   └── Jobs/
│   │       └── ProcessApprovalSequence.php
│   └── NotificationSystem/
│       ├── Models/
│       │   └── Notification.php
│       ├── Notifications/
│       │   └── ComplianceExpiryWarning.php
│       └── Listeners/
│           └── DispatchUploadNotifications.php
├── Http/
│   ├── Middleware/
│   │   ├── ResolveTenantContext.php             # Subdomain-to-Tenant binding
│   │   ├── AuthenticateSupabaseJWT.php          # Supabase Token Gatekeeper
│   │   └── RequireWorkspaceRole.php            # Granular RBAC Check
│   └── Kernel.php
└── Providers/
    ├── AppServiceProvider.php
    ├── RepositoryServiceProvider.php
    └── EventServiceProvider.php
```

---

## 2. Shared Core Trait: Multi-Tenant Scoping

To ensure strict logical tenant separation across all tables, every model representing transactional data utilizes the `HasTenantScope` trait:

```php
<?php

namespace App\Traits;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;

trait HasTenantScope
{
    /**
     * Boot the tenant scoping trait.
     */
    protected static function bootHasTenantScope(): void
    {
        // Automatically inject the organization_id when creating new tenant business records
        static::creating(function ($model) {
            if (app()->bound(Organization::class)) {
                $model->organization_id = app(Organization::class)->id;
            }
        });

        // Enforce a global query constraint on all select statements
        static::addGlobalScope('tenant_isolation', function (Builder $builder) {
            if (app()->bound(Organization::class)) {
                $builder->where('organization_id', '=', app(Organization::class)->id);
            }
        });
    }
}
```

---

## 3. Repository Pattern Implementation

We use the Repository Pattern to de-couple query logic from Controllers, facilitating unit testing and caching strategies.

### 3.1 Interface Specification
```php
<?php

namespace App\Domains\ProjectManagement\Repositories;

use App\Domains\ProjectManagement\Models\Project;
use Illuminate\Support\Collection;

interface ProjectRepositoryInterface
{
    public function allForTenant(): Collection;
    
    public function findById(string $id): ?Project;
    
    public function create(array $data): Project;
    
    public function update(string $id, array $data): bool;
}
```

### 3.2 Concrete Eloquent Implementation
```php
<?php

namespace App\Domains\ProjectManagement\Repositories;

use App\Domains\ProjectManagement\Models\Project;
use Illuminate\Support\Collection;

class ProjectRepository implements ProjectRepositoryInterface
{
    public function allForTenant(): Collection
    {
        // Global scope from HasTenantScope trait automatically handles the organization_id restriction
        return Project::orderBy('name')->get();
    }

    public function findById(string $id): ?Project
    {
        return Project::find($id);
    }

    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function update(string $id, array $data): bool
    {
        $project = $this->findById($id);
        if (!$project) {
            return false;
        }
        return $project->update($data);
    }
}
```

---

## 4. Business Logic Service Layers

Services encapsulate domain rules, transactional actions, external integrations, and security evaluations.

### 4.1 AWS S3 Document Management Service
```php
<?php

namespace App\Domains\DocumentControl\Services;

use App\Domains\DocumentControl\Models\Document;
use Illuminate\Support\Facades\Storage;
use App\Models\Organization;

class S3StorageService
{
    protected string $bucket;

    public function __construct()
    {
        $this->bucket = config('filesystems.disks.s3.bucket');
    }

    /**
     * Generate an AWS S3 presigned PUT URL for secure, direct client-side upload.
     */
    public function generatePresignedUploadUrl(Organization $tenant, string $projectId, string $category, string $fileName): array
    {
        $cleanCategory = str_replace(' ', '_', strtolower($category));
        $s3Path = "{$tenant->id}/{$projectId}/{$cleanCategory}/" . uniqid() . "_{$fileName}";

        $adapter = Storage::disk('s3')->getAdapter();
        $client = $adapter->getClient();
        
        $command = $client->getCommand('PutObject', [
            'Bucket' => $this->bucket,
            'Key'    => $s3Path,
            'ContentType' => 'application/octet-stream',
        ]);

        $request = $client->createPresignedRequest($command, '+15 minutes');
        $presignedUrl = (string) $request->getUri();

        return [
            'presigned_url' => $presignedUrl,
            's3_key' => $s3Path
        ];
    }
}
```

---

## 5. Security Gates & Policies

Laravel Policies guard specific records, validating assigned roles and project scopes.

```php
<?php

namespace App\Domains\DocumentControl\Policies;

use App\Models\User;
use App\Domains\DocumentControl\Models\Document;
use Illuminate\Auth\Access\HandlesAuthorization;

class DocumentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can download a specific architectural drawing or land permit.
     */
    public function download(User $user, Document $document): bool
    {
        // Enforce multi-tenancy logical boundary explicitly
        if ($user->organization_id !== $document->organization_id) {
            return false;
        }

        // Validate user's specialized permissions based on document category restrictions
        if (in_array($document->category, ['Contracts', 'Finance'])) {
            return $user->hasRoleOnProject(['Owner', 'Admin', 'Finance Team'], $document->project_id);
        }

        return $user->hasRoleOnProject(['Owner', 'Admin', 'Project Head', 'Site Engineer', 'Legal Team', 'Auditor'], $document->project_id);
    }

    /**
     * Determine if a user can archive/soft-delete a document version.
     */
    public function archive(User $user, Document $document): bool
    {
        if ($user->organization_id !== $document->organization_id) {
            return false;
        }

        // Only project leadership or organization managers are permitted to execute file deletions
        return $user->hasRoleOnProject(['Owner', 'Admin', 'Project Head'], $document->project_id);
    }
}
```

---

## 6. Event-Driven Workflows (Asynchronous Execution)

Events decoupled from standard processes trigger jobs asynchronously using Redis queues.

### 6.1 Event Definition
```php
<?php

namespace App\Domains\DocumentControl\Events;

use App\Domains\DocumentControl\Models\Document;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentUploaded
{
    use Dispatchable, SerializesModels;

    public Document $document;

    public function __construct(Document $document)
    {
        $this->document = $document;
    }
}
```

### 6.2 Event Queue Listener
```php
<?php

namespace App\Domains\DocumentControl\Listeners;

use App\Domains\DocumentControl\Events\DocumentUploaded;
use App\Domains\NotificationSystem\Notifications\DocumentActivityAlert;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;
use App\Models\User;

class DispatchUploadNotifications implements ShouldQueue
{
    public string $queue = 'notifications'; // Custom dedicated worker queue routing

    /**
     * Process the upload event.
     */
    public function handle(DocumentUploaded $event): void
    {
        $document = $event->document;

        // Fetch targeted project representatives to notify
        $recipients = User::where('organization_id', $document->organization_id)
            ->whereHas('roles', function($query) use ($document) {
                $query->where('project_id', $document->project_id)
                      ->orWhereNull('project_id');
            })
            ->where('id', '!=', $document->uploaded_by_uid)
            ->get();

        // Dispatch alerts
        Notification::send($recipients, new DocumentActivityAlert($document));
    }
}
```

---

## 7. Multi-Channel Notification Layouts

Dynamic notifications route asynchronously across distinct delivery channels.

```php
<?php

namespace App\Domains\NotificationSystem\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Domains\DocumentControl\Models\Document;

class DocumentActivityAlert extends Notification implements ShouldQueue
{
    use Queueable;

    protected Document $document;

    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    /**
     * Declare target transport channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail']; // Dispatches local in-app alert + email notify
    }

    /**
     * Construct email templates.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("BuildVault Alert: Document Added under " . $this->document->project->name)
            ->greeting("Hello, " . $notifiable->name)
            ->line("An engineering artifact has been successfully loaded:")
            ->line("Document: " . $this->document->name)
            ->line("Category: " . $this->document->category)
            ->action("View Document", url("/projects/{$this->document->project_id}/documents"))
            ->line("This is an unmonitored notification from BuildVault.");
    }

    /**
     * Store local database alerts.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => "New Document Uploaded",
            'message' => "{$this->document->name} added under category {$this->document->category}.",
            'project_id' => $this->document->project_id,
            'document_id' => $this->document->id,
            'category' => $this->document->category
        ];
    }
}
```

---

## 8. Scheduled Task Daemons & CLI Workflows

The Laravel task scheduler executes daily background checks to verify target parameters.

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domains\ComplianceManager\Models\ComplianceChecklist;
use App\Domains\NotificationSystem\Notifications\ComplianceExpiryWarning;
use Carbon\Carbon;

class MonitorComplianceExpirations extends Command
{
    protected $signature = 'buildvault:monitor-compliance';
    protected $description = 'Evaluate compliance checklists and dispatch warnings for expirations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("Scanning active regulatory compliance checklists...");

        // Fetch permits expiring within warning thresholds that lack completion proofs
        $expiringItems = ComplianceChecklist::where('status', '!=', 'Complete')
            ->whereDate('expiry_date', '<=', Carbon::now()->addDays(30))
            ->with(['project', 'organization'])
            ->get();

        foreach ($expiringItems as $item) {
            $daysLeft = Carbon::now()->diffInDays($item->expiry_date, false);
            
            // Query Liaison Directors or Legal Officers tied to the expiring project
            $projectLiaisons = $item->project->getComplianceContacts();

            foreach ($projectLiaisons as $contact) {
                $contact->notify(new ComplianceExpiryWarning($item, $daysLeft));
            }

            $this->warn("Alert issued for '{$item->title}' under Project '{$item->project->name}' (Expiring in {$daysLeft} days).");
        }

        $this->info("Compliance warning evaluation process executed successfully.");
        return Command::SUCCESS;
    }
}
```

---

## 9. Horizontal Queue Partitioning & Horizon Configuration

We configure **Laravel Horizon** backed by Redis to manage asynchronous operations safely. This setup segregates priorities dynamically, protecting high-importance alerts from pipeline backlogs.

```php
// config/horizon.php
return [
    'environments' => [
        'production' => [
            'supervisor-api-workers' => [
                'connection' => 'redis',
                'queue' => ['default', 'file-uploads'],
                'balance' => 'auto',
                'minProcesses' => 3,
                'maxProcesses' => 10,
                'tries' => 3,
                'timeout' => 90,
            ],
            'supervisor-notification-dispatch' => [
                'connection' => 'redis',
                'queue' => ['notifications', 'whatsapp-alerts'],
                'balance' => 'simple',
                'processes' => 5,
                'tries' => 5,
                'timeout' => 60,
            ]
        ],
    ]
];
```
-   `file-uploads`: Auto-scales up to 10 parallel processes to handle checksum verification and metadata cataloging.
-   `notifications`: Simple execution allocation with guaranteed low latency to deliver critical alerts quickly. This setup prevents site-level updates from blocking urgent compliance or regulatory expiration notifications.
