<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SEED_ADMIN_EMAIL', 'admin@captainstudio.local');
        $password = env('SEED_ADMIN_PASSWORD');
        $generated = blank($password);

        if ($generated) {
            $password = Str::password(16, symbols: false);
        }

        $user = User::withoutEvents(fn () => User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('SEED_ADMIN_NAME', 'Super Admin'),
                'password' => $password,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        ));

        $user->syncRoles([RoleName::SuperAdmin->value]);

        if ($generated) {
            $this->command?->newLine();
            $this->command?->warn('Super Admin created. Store these credentials now, they will not be shown again:');
            $this->command?->line("  email:    {$email}");
            $this->command?->line("  password: {$password}");
            $this->command?->newLine();
        }
    }
}
