<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    protected const CACHE_KEY = 'settings:all_map';
    protected const CACHE_TTL_SECONDS = 86400;

    /**
     * Get a setting by key, returning $default if not found.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        /** @var array<string, mixed> $settings */
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return Setting::query()->pluck('value', 'key')->all();
        });

        return array_key_exists($key, $settings) ? $settings[$key] : $default;
    }

    /**
     * Set a setting key and value, clearing cache.
     */
    public static function set(string $key, mixed $value, ?string $group = null): Setting
    {
        $setting = Setting::query()->where('key', $key)->first();

        if ($setting) {
            $setting->value = $value;
            if ($group !== null) {
                $setting->group = $group;
            }
            $setting->save();
        } else {
            $setting = Setting::query()->create([
                'key' => $key,
                'value' => $value,
                'group' => $group ?? 'general',
            ]);
        }

        self::clearCache();

        return $setting;
    }

    /**
     * Clear cached settings.
     */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Forget cached setting (clears settings cache).
     */
    public static function forget(string $key): void
    {
        self::clearCache();
    }

    /**
     * Get all settings as associative key => value array.
     *
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return Setting::query()->pluck('value', 'key')->all();
        });
    }
}
