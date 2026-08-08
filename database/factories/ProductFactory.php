<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucwords($name),
            'code' => strtoupper(fake()->unique()->bothify('???-##')),
            'description' => fake()->sentence(),
            'is_active' => true,
            'technical_owner_id' => null,
            'support_role_id' => null,
            'default_trial_days' => 14,
            'demo_notes' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
