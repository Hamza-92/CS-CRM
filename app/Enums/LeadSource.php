<?php

namespace App\Enums;

enum LeadSource: string
{
    case Website = 'website';
    case Referral = 'referral';
    case Social = 'social';
    case ColdCall = 'cold_call';
    case WhatsApp = 'whatsapp';
    case Exhibition = 'exhibition';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ColdCall => 'Cold call',
            self::WhatsApp => 'WhatsApp',
            default => ucfirst($this->value),
        };
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $source) => ['value' => $source->value, 'label' => $source->label()], self::cases());
    }
}
