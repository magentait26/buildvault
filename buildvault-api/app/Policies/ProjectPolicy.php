<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProjectPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can view project logs.
     */
    public function view(User $user, Project $project): bool
    {
        if ($user->organization_id !== $project->organization_id) {
            return false;
        }

        // Global roles like Super Admin, Auditor, Compliance Officer can view any project
        if ($user->hasPermission('read:projects')) {
            return true;
        }

        // Project lead or site engineers specifically assigned can view
        return $project->users()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine if a user can establish new project locations.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('write:projects');
    }

    /**
     * Determine if a user can edit project scopes.
     */
    public function update(User $user, Project $project): bool
    {
        if ($user->organization_id !== $project->organization_id) {
            return false;
        }

        if ($user->hasPermission('write:projects')) {
            return true;
        }

        // Check if user is the designated lead
        return strtolower($project->lead_name) === strtolower($user->name);
    }

    /**
     * Determine if a user can dissolve/soft-delete a project milestone.
     */
    public function delete(User $user, Project $project): bool
    {
        if ($user->organization_id !== $project->organization_id) {
            return false;
        }

        return $user->hasPermission('delete:projects');
    }
}
