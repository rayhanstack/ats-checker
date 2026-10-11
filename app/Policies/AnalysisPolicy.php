<?php

namespace App\Policies;

use App\Models\Analysis;
use App\Models\User;

class AnalysisPolicy
{
    /**
     * Determine whether the user can view the analysis.
     */
    public function view(User $user, Analysis $analysis): bool
    {
        return $user->id === $analysis->user_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can re-run analysis.
     */
    public function rerun(User $user, Analysis $analysis): bool
    {
        return $user->id === $analysis->user_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can download / export the analysis.
     */
    public function download(User $user, Analysis $analysis): bool
    {
        return $user->id === $analysis->user_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the analysis.
     */
    public function delete(User $user, Analysis $analysis): bool
    {
        return $user->id === $analysis->user_id || $user->isAdmin();
    }
}
