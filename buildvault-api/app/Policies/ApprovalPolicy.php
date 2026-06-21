<?php

namespace App\Policies;

use App\Models\Approval;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ApprovalPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can check progress of an approval pipeline.
     */
    public function view(User $user, Approval $approval): bool
    {
        return $user->organization_id === $approval->organization_id;
    }

    /**
     * Determine if a user can participate as reviewer/sign-off entity.
     */
    public function signOff(User $user, Approval $approval): bool
    {
        if ($user->organization_id !== $approval->organization_id) {
            return false;
        }

        // Must be registered in the reviewers list for this specific approval
        return $approval->approvals()->where('approver_user_id', $user->id)->exists();
    }
}
