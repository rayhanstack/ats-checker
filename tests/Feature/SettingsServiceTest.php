<?php

use App\Models\Setting;
use App\Services\SettingsService;
use Database\Seeders\SettingSeeder;

beforeEach(function () {
    $this->seed(SettingSeeder::class);
});

test('settings service retrieves seeded default settings', function () {
    expect(SettingsService::get('site_name'))->toBe('ATS Checker')
        ->and(SettingsService::get('trial_days'))->toBe(7)
        ->and(SettingsService::get('max_upload_mb'))->toBe(5)
        ->and(SettingsService::get('allowed_file_types'))->toBe('pdf,docx')
        ->and(SettingsService::get('registration_enabled'))->toBe(true);
});

test('settings service returns default fallback when key does not exist', function () {
    expect(SettingsService::get('non_existent_key', 'fallback_val'))->toBe('fallback_val')
        ->and(SettingsService::get('non_existent_key'))->toBeNull();
});

test('settings service sets and caches values cleanly', function () {
    SettingsService::set('custom_feature_flag', true, 'features');

    expect(SettingsService::get('custom_feature_flag'))->toBe(true);

    // Update value and verify cache invalidation
    SettingsService::set('custom_feature_flag', false, 'features');
    expect(SettingsService::get('custom_feature_flag'))->toBe(false);
});
