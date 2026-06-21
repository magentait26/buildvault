<?php

namespace App\Policies;

use App\Models\ComplianceRecord;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ComplianceRecordPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can review NOC/RERA compliance targets.
     */
    public function view(User $user, ComplianceRecord $record): bool
    {
        return $user->organization_id === $record->organization_id;
    }

    /**
     * Determine if a user can append target dates.
     */
    public function manage(User $user): bool
    {
        // Only Project Heads, Legal and Super Admins can alter statutory requirements keys
        return $user->hasPermission('write:projects');
    }
}
