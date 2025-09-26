<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    /**
     * Check if user is Alouaoui (only he can manage events)
     */
    private function isAlouaoui(User $user): bool
    {
        return $user->name === 'Alouaoui' || $user->email === 'alouaoui@example.com';
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Admin can view all events, students can view public events
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        // Anyone can view individual events (for access checking)
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only Alouaoui can create events
        return $user->role === 'admin' && $this->isAlouaoui($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        // Only Alouaoui can update events
        return $user->role === 'admin' && $this->isAlouaoui($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        // Only Alouaoui can delete events
        return $user->role === 'admin' && $this->isAlouaoui($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Event $event): bool
    {
        // Only Alouaoui can restore events
        return $user->role === 'admin' && $this->isAlouaoui($user);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Event $event): bool
    {
        // Only Alouaoui can permanently delete events
        return $user->role === 'admin' && $this->isAlouaoui($user);
    }
}
