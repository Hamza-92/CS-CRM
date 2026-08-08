<?php

namespace App\Enums;

enum BillingCycle: string
{
    case Trial = 'trial';
    case Monthly = 'monthly';
    case Quarterly = 'quarterly';
    case SemiAnnual = 'semi_annual';
    case Annual = 'annual';
    case Lifetime = 'lifetime';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Trial => 'Trial / Demo',
            self::Monthly => 'Monthly',
            self::Quarterly => 'Quarterly',
            self::SemiAnnual => '6 Months',
            self::Annual => 'Annual',
            self::Lifetime => 'Lifetime',
            self::Custom => 'Custom',
        };
    }

    public function defaultDurationDays(): ?int
    {
        return match ($this) {
            self::Trial => 14,
            self::Monthly => 30,
            self::Quarterly => 90,
            self::SemiAnnual => 182,
            self::Annual => 365,
            self::Lifetime, self::Custom => null,
        };
    }

    public function isOpenEnded(): bool
    {
        return $this === self::Lifetime;
    }

    public function isTrial(): bool
    {
        return $this === self::Trial;
    }

    /**
     * @return array<int, array{value: string, label: string, default_duration_days: int|null}>
     */
    public static function options(): array
    {
        return array_map(fn (self $case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'default_duration_days' => $case->defaultDurationDays(),
        ], self::cases());
    }
}
