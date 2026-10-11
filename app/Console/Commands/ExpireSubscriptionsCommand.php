<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

class ExpireSubscriptionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire overdue subscriptions and trial periods';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for expired subscriptions...');

        $now = now();

        $expiredSubscriptionsCount = Subscription::query()
            ->whereIn('status', ['active', 'trialing', 'past_due'])
            ->whereNotNull('ends_at')
            ->where('ends_at', '<', $now)
            ->update([
                'status' => 'expired',
            ]);

        $this->info("Expired {$expiredSubscriptionsCount} overdue subscriptions.");

        return self::SUCCESS;
    }
}
