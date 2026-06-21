<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SystemSettingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can alter system credentials/size thresholds.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('manage:settings');
    }
}
