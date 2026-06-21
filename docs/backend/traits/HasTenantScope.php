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
        // Automatically inject organization_id on creation of new tenant records
        static::creating(function ($model) {
            if (app()->bound(Organization::class)) {
                $model->organization_id = app(Organization::class)->id;
            }
        });

        // Enforce a global query constraint on all select queries
        static::addGlobalScope('tenant_isolation', function (Builder $builder) {
            if (app()->bound(Organization::class)) {
                $builder->where('organization_id', '=', app(Organization::class)->id);
            }
        });
    }
}
