<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Contracts\PaymentGateway::class, function () {
            $driver = \App\Services\SettingsService::get('payment_gateway', 'manual');

            return match ($driver) {
                'manual' => $this->app->make(\App\Services\PaymentGateways\ManualGateway::class),
                default => $this->app->make(\App\Services\PaymentGateways\ManualGateway::class),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
