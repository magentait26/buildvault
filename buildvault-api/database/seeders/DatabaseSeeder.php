<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Project;
use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Declare Permission Slugs
        $permissionsList = [
            'read:projects' => 'Authorize reading of projects property details',
            'write:projects' => 'Authorize addition, editing of construction sites & RERA numbers',
            'delete:projects' => 'Authorize soft deletion of major projects assets',
            'read:documents' => 'Authorize view statutory clearances',
            'write:documents' => 'Authorize file revision uploads',
            'approve:documents' => 'High-compliance digital clearance approvals signing key capabilities',
            'manage:settings' => 'Modify UI color limits, cloud server configs, and active elements',
        ];

        $permissionModels = [];
        foreach ($permissionsList as $slug => $desc) {
            $permissionModels[$slug] = Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'id' => (string) Str::uuid(),
                    'description' => $desc,
                ]
            );
        }

        // 2. Declare Roles
        $rolesDef = [
            'Super Admin' => [
                'description' => 'Organization core administrative supervisor. Governs configurations of active modules.',
                'permissions' => ['read:projects', 'write:projects', 'delete:projects', 'read:documents', 'write:documents', 'approve:documents', 'manage:settings'],
            ],
            'Director' => [
                'description' => 'Board representative. Oversees high-compliance filings and executes legal sign-offs.',
                'permissions' => ['read:projects', 'write:projects', 'read:documents', 'write:documents', 'approve:documents'],
            ],
            'Project Manager' => [
                'description' => 'Organizes specific residential builders properties, timelines and uploaded files.',
                'permissions' => ['read:projects', 'write:projects', 'read:documents', 'write:documents'],
            ],
            'Compliance Officer' => [
                'description' => 'Audits timeline clearances, expiration penalties and statutory legal title deeds.',
                'permissions' => ['read:projects', 'read:documents', 'write:documents', 'approve:documents'],
            ],
            'Site Engineer' => [
                'description' => 'Fields representative. Directly uploads physical inspection reports and certificates.',
                'permissions' => ['read:projects', 'read:documents', 'write:documents'],
            ],
        ];

        $roleModels = [];
        foreach ($rolesDef as $roleName => $meta) {
            $role = Role::firstOrCreate(
                ['name' => $roleName],
                [
                    'id' => (string) Str::uuid(),
                    'description' => $meta['description'],
                ]
            );
            
            $roleModels[$roleName] = $role;

            // Link permissions to roles uniquely using sync
            $pIds = [];
            foreach ($meta['permissions'] as $pSlug) {
                if (isset($permissionModels[$pSlug])) {
                    $pIds[] = $permissionModels[$pSlug]->id;
                }
            }
            $role->permissions()->sync($pIds);
        }

        // 3. Create Default Organization Workspace
        $org = \DB::table('organizations')->where('name', 'ABC Builders Ltd')->first();
        if (!$org) {
            $orgId = (string) Str::uuid();
            \DB::table('organizations')->insert([
                'id' => $orgId,
                'name' => 'ABC Builders Ltd',
                'trade_license_no' => 'TL-90312487A',
                'pan_no' => 'AAACA3199K',
                'registered_address' => 'BuildVault Towers, Commercial Area Sector-44, Gurugram, HR',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $orgId = $org->id;
        }

        // 4. Create Standard System Settings Config
        $existingSetting = SystemSetting::where('organization_id', $orgId)->first();
        if ($existingSetting) {
            $existingSetting->update([
                'primary_color' => '#115e59',
                'secondary_color' => '#0f766e',
                'allowed_file_types' => ['pdf', 'dwg', 'zip', 'png', 'jpg', 'docx'],
                'file_size_limit_mb' => 50,
                'active_storage_provider' => 'local',
                'enabled_modules' => ['properties', 'clearances', 'deadlines', 'penalties', 'analytics'],
            ]);
        } else {
            SystemSetting::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $orgId,
                'primary_color' => '#115e59',
                'secondary_color' => '#0f766e',
                'allowed_file_types' => ['pdf', 'dwg', 'zip', 'png', 'jpg', 'docx'],
                'file_size_limit_mb' => 50,
                'active_storage_provider' => 'local',
                'enabled_modules' => ['properties', 'clearances', 'deadlines', 'penalties', 'analytics'],
            ]);
        }

        // 5. Create Default User Accounts
        $usersDef = [
            [
                'name' => 'Riyaz Ahammed Adhoni',
                'email' => 'riyaz26@gmail.com',
                'role' => 'Super Admin',
                'password' => 'Magenta@#921',
            ],
            [
                'name' => 'Vikram Sen',
                'email' => 'vikram@buildvault.io',
                'role' => 'Super Admin',
                'password' => 'secret123',
            ],
            [
                'name' => 'Arjun Rao',
                'email' => 'arjun@abcbuilders.com',
                'role' => 'Director',
                'password' => 'secret123',
            ],
            [
                'name' => 'Priya Menon',
                'email' => 'priya@abcbuilders.com',
                'role' => 'Project Manager',
                'password' => 'secret123',
            ],
            [
                'name' => 'Ananya Iyer',
                'email' => 'ananya@abcbuilders.com',
                'role' => 'Compliance Officer',
                'password' => 'secret123',
            ],
        ];

        foreach ($usersDef as $u) {
            $existingUser = User::where('email', $u['email'])->first();
            if ($existingUser) {
                $existingUser->update([
                    'organization_id' => $orgId,
                    'role_id' => $roleModels[$u['role']]->id,
                    'name' => $u['name'],
                    'password_hash' => Hash::make($u['password']),
                    'is_active' => true,
                ]);
            } else {
                User::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'role_id' => $roleModels[$u['role']]->id,
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'password_hash' => Hash::make($u['password']),
                    'is_active' => true,
                ]);
            }
        }

        // 6. Create Seed compliance Projects & sites
        $projects = [
            [
                'name' => 'Bhoomi Gardenia Phase I',
                'location' => 'Sector 15, Kharghar, Navi Mumbai',
                'start_date' => '2025-01-10',
                'handover_date' => '2028-12-30',
                'status' => 'Active',
                'rera_registration_no' => 101.4,
                'rera_registration_id' => 'P51700001041',
            ],
            [
                'name' => 'Vrindavan Tech-HQ',
                'location' => 'Outer Ring Road, Bengaluru',
                'start_date' => '2024-06-01',
                'handover_date' => '2027-06-01',
                'status' => 'Active',
                'rera_registration_no' => 102.8,
                'rera_registration_id' => 'PRM/KA/RERA/1251/310/PR/200723/003490',
            ],
        ];

        foreach ($projects as $proj) {
            // Support both standard rera_registration_no and old typo rere_registration_no columns
            if (!\Schema::hasColumn('projects', 'rera_registration_no') && \Schema::hasColumn('projects', 'rere_registration_no')) {
                $proj['rere_registration_no'] = $proj['rera_registration_no'];
                unset($proj['rera_registration_no']);
            }
            Project::firstOrCreate(
                ['rera_registration_id' => $proj['rera_registration_id']],
                array_merge($proj, ['id' => (string) Str::uuid()])
            );
        }
    }
}
