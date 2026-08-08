<?php

namespace Database\Factories;

use App\Enums\BillingCycle;
use App\Models\Plan;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $cycle = fake()->randomElement([
            BillingCycle::Monthly,
            BillingCycle::Quarterly,
            BillingCycle::Annual,
        ]);

        return [
            'product_id' => Product::factory(),
            'name' => $cycle->label(),
            'code' => strtoupper(fake()->unique()->bothify('PLN-###')),
            'billing_cycle' => $cycle,
            'duration_days' => $cycle->defaultDurationDays(),
            'price' => fake()->numberBetween(5, 500) * 100,
            'currency' => config('crm.default_currency'),
            'grace_days' => config('crm.default_grace_days'),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function trial(): static
    {
        return $this->state(fn () => [
            'name' => BillingCycle::Trial->label(),
            'billing_cycle' => BillingCycle::Trial,
            'duration_days' => BillingCycle::Trial->defaultDurationDays(),
            'price' => 0,
        ]);
    }

    public function lifetime(): static
    {
        return $this->state(fn () => [
            'name' => BillingCycle::Lifetime->label(),
            'billing_cycle' => BillingCycle::Lifetime,
            'duration_days' => null,
        ]);
    }
}
