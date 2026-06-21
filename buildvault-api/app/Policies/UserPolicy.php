<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can administer other organizational user profiles.
     */
    public function manage(User $user): bool
    {
        return $user->hasPermission('manage:settings');
    }
}
