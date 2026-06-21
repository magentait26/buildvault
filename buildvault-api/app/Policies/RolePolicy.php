<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RolePolicy
{
    use HandlesAuthorization;

    /**
     * Guard role schema creation.
     */
    public function manage(User $user): bool
    {
        return $user->hasPermission('manage:settings');
    }
}
