<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer l'utilisateur admin
        User::updateOrCreate(
            ['phone' => '0555123456'], // Identifier par téléphone
            [
                'name' => 'Administrator',
                'email' => 'admin@alouaoui-school.com',
                'phone' => '0555123456',
                'password' => Hash::make('123456789'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->command->info('✅ Utilisateur admin créé avec succès!');
        $this->command->info('📧 Email: admin@alouaoui-school.com');
        $this->command->info('📱 Téléphone: 0555123456');
        $this->command->info('🔑 Mot de passe: 123456789');
    }
}
