<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'site_name',
                'value' => 'ATS Checker',
                'group' => 'general',
            ],
            [
                'key' => 'site_tagline',
                'value' => 'AI-Powered Resume Optimization & ATS Scoring',
                'group' => 'general',
            ],
            [
                'key' => 'logo_path',
                'value' => null,
                'group' => 'general',
            ],
            [
                'key' => 'contact_email',
                'value' => 'support@atschecker.local',
                'group' => 'contact',
            ],
            [
                'key' => 'contact_phone',
                'value' => '+1 (555) 019-2834',
                'group' => 'contact',
            ],
            [
                'key' => 'contact_address',
                'value' => '100 Innovation Way, Suite 400, San Francisco, CA 94105',
                'group' => 'contact',
            ],
            [
                'key' => 'social_links',
                'value' => [
                    'twitter' => 'https://twitter.com',
                    'linkedin' => 'https://linkedin.com',
                    'github' => 'https://github.com',
                ],
                'group' => 'social',
            ],
            [
                'key' => 'trial_days',
                'value' => 7,
                'group' => 'billing',
            ],
            [
                'key' => 'payment_gateway',
                'value' => 'manual',
                'group' => 'billing',
            ],
            [
                'key' => 'max_upload_mb',
                'value' => 5,
                'group' => 'upload',
            ],
            [
                'key' => 'allowed_file_types',
                'value' => 'pdf,docx',
                'group' => 'upload',
            ],
            [
                'key' => 'max_jd_chars',
                'value' => 15000,
                'group' => 'analysis',
            ],
            [
                'key' => 'analysis_throttle_per_hour',
                'value' => 10,
                'group' => 'analysis',
            ],
            [
                'key' => 'resume_retention_days',
                'value' => 30,
                'group' => 'retention',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => false,
                'group' => 'system',
            ],
            [
                'key' => 'registration_enabled',
                'value' => true,
                'group' => 'auth',
            ],
            [
                'key' => 'email_verification_required',
                'value' => true,
                'group' => 'auth',
            ],
            [
                'key' => 'google_login_enabled',
                'value' => true,
                'group' => 'auth',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'group' => $setting['group'],
                ]
            );
        }
    }
}
