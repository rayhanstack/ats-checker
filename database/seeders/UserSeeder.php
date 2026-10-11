<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminEmail = env('ADMIN_EMAIL', 'admin@atschecker.local');
        $adminPassword = env('ADMIN_PASSWORD', 'Password123!');

        User::query()->updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'System Administrator',
                'password' => Hash::make($adminPassword),
                'role' => Role::Admin,
                'email_verified_at' => now(),
                'is_active' => true,
                'trial_ends_at' => now()->addYears(10),
            ]
        );

        $demoUsers = [
            [
                'name' => 'Alex Morgan',
                'email' => 'alex@example.com',
                'password' => Hash::make('password'),
                'role' => Role::User,
                'email_verified_at' => now(),
                'is_active' => true,
                'trial_ends_at' => now()->addDays(7),
            ],
            [
                'name' => 'Sarah Jenkins',
                'email' => 'sarah@example.com',
                'password' => Hash::make('password'),
                'role' => Role::User,
                'email_verified_at' => now(),
                'is_active' => true,
                'trial_ends_at' => now()->addDays(5),
            ],
            [
                'name' => 'Marcus Chen',
                'email' => 'marcus@example.com',
                'password' => Hash::make('password'),
                'role' => Role::User,
                'email_verified_at' => now(),
                'is_active' => true,
                'trial_ends_at' => now()->addDays(2),
            ],
        ];

        foreach ($demoUsers as $demo) {
            User::query()->updateOrCreate(
                ['email' => $demo['email']],
                $demo
            );
        }
    }
}
