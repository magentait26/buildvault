<?php

namespace App\Traits;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;

trait HasOrganizationScope
{
    /**
     * Boot the organization scoping trait.
     */
    protected static function bootHasOrganizationScope(): void
    {
        // Automatically inject organization_id on creation of new records
        static::creating(function ($model) {
            if (app()->bound(Organization::class)) {
                $model->organization_id = app(Organization::class)->id;
            }
        });

        // Enforce a global query constraint on all select queries
        static::addGlobalScope('organization_isolation', function (Builder $builder) {
            if (app()->bound(Organization::class)) {
                $builder->where('organization_id', '=', app(Organization::class)->id);
            }
        });
    }
}
