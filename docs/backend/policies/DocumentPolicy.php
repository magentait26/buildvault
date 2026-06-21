<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DocumentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if a user can download regulatory files or land deeds.
     */
    public function download(User $user, Document $document): bool
    {
        if ($user->organization_id !== $document->organization_id) {
            return false;
        }

        // Restrict sensitive content (Contracts & Finance) to explicit roles/permissions
        if (in_array($document->category, ['Contracts', 'Finance'])) {
            return $user->role->name === 'Super Admin' || 
                   $user->role->name === 'Finance Team' || 
                   $user->role->name === 'Director';
        }

        return $user->hasPermission('read:documents');
    }

    /**
     * Determine if a user can write/upload architectural files.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('write:documents');
    }

    /**
     * Determine if a user can archive/soft-delete architectural models.
     */
    public function archive(User $user, Document $document): bool
    {
        if ($user->organization_id !== $document->organization_id) {
            return false;
        }

        // Only high-level directors or Super Admin permissions can clear archives
        return $user->hasPermission('delete:documents');
    }
}
