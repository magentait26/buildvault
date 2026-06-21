# BuildVault — Enterprise AWS Infrastructure Design & Deployment Guide

**Document ID:** BV-AWS-08  
**Author:** AWS Solutions Architect  
**Date:** June 15, 2026  
**Status:** Approved for Cloud Provisioning  
**Version:** 1.0.0  

---

This document establishes the production-grade, highly available, and secure **AWS Cloud Infrastructure Architecture** for **BuildVault**. The deployment configuration guarantees complete multi-tenant isolation, automatic scale-out pipelines under compute load, strict cryptographic compliance, and disaster recovery.

---

## 1. Directory of Selected AWS Services

The system utilizes specialized elastic cloud services partitioned across logical tiers:

| Infrastructure Tier | AWS Cloud Service | Core Functional Purpose |
| :--- | :--- | :--- |
| **Edge Domain & Delivery** | Amazon Route 53 | DNS mapping, automatic geo-routing, wildcard SSL validation, and health checks. |
| | Amazon CloudFront | Content Delivery Network (CDN) caching static React assets closer to regional builder locations. |
| | AWS WAF (Web Application Firewall)| Block OWASP Top 10 vulnerabilities, bad spiders, and brute force login attempts. |
| **Compute Engine** | Amazon ECS on Fargate | Serverless container cluster orchestration. Scales the Laravel API and Horizon Queue processes independently. |
| | AWS Application Load Balancer | TLS 1.3 termination, path-based request routing, and deep health monitoring. |
| **Isolated Database Tier**| Amazon Aurora Serverless v2 | Multi-AZ Postgres database service tracking tenant metrics. Scales database capacity seamlessly. |
| | Amazon ElastiCache for Redis | Super-fast cache cluster, rate-limiting store, and backend queue driver. |
| **Storage Engine** | Amazon S3 (Simple Storage) | Encrypted storage space for engineering drawings, land records, and compliance NOCs. |
| **Security & Audits** | AWS KMS (Key Management) | HSM backed Envelope Encryption storage protecting integration client keys. |
| | AWS IAM | Explicit least-privilege IAM roles utilizing OpenID Connect (OIDC) identities. |
| | AWS Secrets Manager | Rotation and injection of sensitive storage profiles and core database keys. |
| **Logs & Performance** | Amazon CloudWatch | Dynamic audit log traces, system monitoring screens, and target alarms. |

---

## 2. Network Architecture (VPC & Ingress Paths)

The environment runs inside a designated Virtual Private Cloud (VPC) spanning multiple Availability Zones (AZ) to ensure high availability:

```
[Internet Client Traffic]
          │ (HSTS Overrides Enforced)
          ▼
    [AWS Route 53]
          │
          ▼
 [Amazon CloudFront CDN + AWS WAF Security Policies]
          │
          ▼
 [AWS Application Load Balancer (ALB)] ◄─── Terminate SSL Certificates
          │
          ├─── (Private Private Network Routing) ───┐
          ▼                                       ▼
 [Public Subnet 1: AZ-A]                [Public Subnet 2: AZ-B]
   • Public NAT Gateway A                 • Public NAT Gateway B
          │                                       │
          ├─── (Elastic Network Interface) ───────┤
          ▼                                       ▼
 [Private App Subnet 1: AZ-A]           [Private App Subnet 2: AZ-B]
   • ECS Task: Laravel 12 API             • ECS Task: Laravel 12 API
   • ECS Task: Horizon Worker Process     • ECS Task: Horizon Worker Process
          │                                       │
          ├─── (Strict SG Access Layer) ──────────┤
          ▼                                       ▼
 [Private Data Subnet 1: AZ-A]          [Private Data Subnet 2: AZ-B]
   • Aurora Postgres (Primary Node)      • Aurora Postgres (Read Replica)
   • ElastiCache Redis Primary           • ElastiCache Redis Replica
```

### 2.1 Subnet Address Partitioning (10.0.0.0/16 VPC Range)
*   **Public Subnets (Ingress & NATs):**
    *   `10.0.1.0/24` - Public Subnet A (AZ1)
    *   `10.0.2.0/24` - Public Subnet B (AZ2)
*   **Private App Subnets (Container Compute Cluster):**
    *   `10.0.10.0/24` - Private App Subnet A (AZ1)
    *   `10.0.20.0/24` - Private App Subnet B (AZ2)
*   **Isolated Data Subnets (PostgreSQL DB, Redis & S3 VPC Endpoints):**
    *   `10.0.100.0/24` - Private Database Subnet A (AZ1)
    *   `10.0.200.0/24` - Private Database Subnet B (AZ2)

---

## 3. Production AWS S3 Storage Topology

To store heavy CAD drawings, building site photographs, and RERA certifications securely, BuildVault relies on a centralized AWS S3 Bucket partitioned using strict logical separation prefixes.

### 3.1 Security Policies Configuration
*   **No Public Block Overrides:** Public bucket policy configurations are set to `BlockPublicAcls = True` and `BlockPublicPolicy = True`. Direct public lookups are blocked.
*   **Enforceable Server-Side Encryption (SSE-KMS):** Every write must specify structural encryption utilizing AWS KMS Customer Managed Keys (CMK).
*   **S3 Object Lock Compliance:** Land records and legal compliance archives utilize an **S3 Object Lock (Compliance Mode)** lock for 3 years, preventing deletion or manipulation of critical legal records by any user role (including the Owner).

```xml
<!-- Example of enforceable S3 Bucket Policy (KMS Encryption Rules) -->
<BucketPolicy>
  <Statement>
    <Sid>DenyUnencryptedObjectUploads</Sid>
    <Effect>Deny</Effect>
    <Principal>*</Principal>
    <Action>s3:PutObject</Action>
    <Resource>arn:aws:s3:::buildvault-prod-storage-bucket/*</Resource>
    <Condition>
      <StringNotEquals>
        <Key>s3:x-amz-server-side-encryption</Key>
        <Value>aws:kms</Value>
      </StringNotEquals>
    </Condition>
  </Statement>
</BucketPolicy>
```

---

## 4. Multi-Tenant Database Backup Strategy

Data safety and uptime metrics are optimized using layered, serverless AWS backup pipelines.

*   **Continuous Automated Snapshot backups:** Amazon Aurora is configured to run physical snapshots automatically. Backups execute during idle times (02:00 UTC target window). Backups are retained for 35 days.
*   **Point-in-Time Recovery (PITR):** Enables transaction-level database rollbacks back to any single millisecond state inside the active 35-day retention zone.
*   **Cross-Region Multi-AZ DR Backups:** Live replica snapshots are synchronized asynchronously to an isolated AWS Region (e.g., from ap-south-1 Mumbai to ap-southeast-1 Singapore) to safeguard corporate tenant data against severe geographic emergencies.

---

## 5. Comprehensive Recovery & Disaster Strategy (DR)

BuildVault maps system errors and recovery processes according to two core metrics:
1.  **RPO (Recovery Point Objective):** The maximum tolerable timeframe of data loss before a recovery state is achieved (Target limit: **5 minutes**).
2.  **RTO (Recovery Time Objective):** The maximum duration of service unavailability before restoration (Target limit: **15 minutes**).

### 5.1 Recovery Procedures Mapped
*   **Compute Tier Outages:** If Fargate containers in AZ-A fail or experience degradation, the ALB routes all ingress traffic to AZ-B tasks. ECS registers the degradation and terminates the unhealthy pods, automatically instantiating healthy container instances.
*   **Primary Database Outage:** If the primary Amazon Aurora cluster node goes offline, the Aurora cluster driver automatically promotes the Multi-AZ Read Replica to Primary status. The failover process updates DNS queries dynamically and completes in less than **30 seconds**.
*   **Geographic Disaster Recovery (Active-Passive Strategy):**
    If an entire AWS cloud datacenter region suffers prolonged failure:
    1.  The Operations Team activates the backup infrastructure setup mapping in the Singapore fallback region.
    2.  The target AWS Aurora Global Database switches roles, promoting Singapore as the master.
    3.  Route 53 DNS records update their active weights, redirecting user client connections to Singapore endpoints. Uptime resumes.

---

## 6. Real-Time Security Monitoring & Audits

Uptime performance, security alerts, and tenant data traffic are logged and visualized inside **AWS CloudWatch**:

1.  **Metric Fire Alarms (Alert Rules):**
    *   *High CPU compute alert:* Triggered if Fargate CPU climbs past 75% for 3 consecutive minutes, prompting container scaling.
    *   *DB Connection alert:* Set to trigger if active PostgreSQL database connections climb past 90% capacity limits.
2.  **AWS GuardDuty Threat Analysis:** continuous analysis of VPC Flow Logs and API activity records to detect abnormal traffic patterns, SQL injection paths, or remote SSH scanning.
3.  **AWS CloudTrail Management Audits:** Comprehensive AWS API trace records tracking infrastructure changes, bucket rule modifications, or privilege modifications. Logs are saved in write-once-read-many (WORM) storage.

---

## 7. Cost Optimization & Resource Scaling Rules

Infrastructure allocations must balance high availability with budget efficiency. BuildVault utilizes serverless auto-scaling rules to maintain optimal resource configuration.

*   **Compute Tier Scaling (Fargate):** ECS tasks are configured with dynamic scale-out and scale-in triggers:
```
  [Containers Allocation Normal: 2 Tasks] 
                       │
                       ├───────► Trigger Scale-Out Task (+1 Task)
                       │         IF Total Cluster Average CPU > 70% OR Memory > 75%
                       │
                       ├───────► Trigger Scale-In Task (-1 Task, Min: 2 Tasks)
                       │         IF Total Cluster Average CPU < 25% for 15 consecutive minutes
                       ▼
             [Absolute Max Capacity Boundary: 10 Tasks]
```
*   **AWS Aurora PostgreSQL Serverless v2 Scaling:** Autoscales database capacity from **2 ACUs (Aurora Capacity Units)** under typical conditions up to **32 ACUs** during high load, scaling resource footprints and costs downward automatically.
*   **Redis Cache Eviction Rules:** Amazon ElastiCache operates with the `volatile-lru` eviction algorithm. This setting preserves session states and queue elements while discarding expired permission keys dynamically to optimize memory consumption.

---

## 8. Secure Infrastructure Deployment Code (Terraform IaC)

We manage resource provisioning through **Terraform**, ensuring reproducible infrastructure configurations across Development, Staging, and Production environments.

```hcl
# main.tf - AWS Production Network Definition
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "buildvault-terraform-state-prod"
    key            = "infrastructure/state.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "buildvault-lock-tracker"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "BuildVault"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

# 1. Primary Isolated Virtual Private Cloud (VPC)
resource "aws_vpc" "production_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "buildvault-production-vpc"
  }
}

# 2. AWS S3 Encrypted Document Storage Bucket
resource "aws_s3_bucket" "secure_storage" {
  bucket        = "buildvault-prod-storage-bucket"
  force_destroy = false

  tags = {
    Name = "buildvault-secure-document-store"
  }
}

# Require complete private block overrides across S3
resource "aws_s3_bucket_public_access_block" "private_boundary" {
  bucket = aws_s3_bucket.secure_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enforce SSE-KMS Server-Side Envelope Encryption on active S3 objects
resource "aws_s3_bucket_server_side_encryption_configuration" "kms_configuration" {
  bucket = aws_s3_bucket.secure_storage.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = "alias/aws/s3"
      sse_algorithm     = "aws:kms"
    }
  }
}
```
This Terraform configuration enforces S3 private access blocks and KMS encryption directly at the AWS API gateway level on resource initialization. This guarantees a secure platform architecture that prevents unauthorized data access across the entire multi-tenant infrastructure.
