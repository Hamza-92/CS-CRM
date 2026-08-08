<?php

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case Interested = 'interested';
    case DemoRequired = 'demo_required';
    case DemoSetup = 'demo_setup';
    case TrialRunning = 'trial_running';
    case Converted = 'converted';
    case NoResponse = 'no_response';
    case CallLater = 'call_later';
    case NotInterested = 'not_interested';
    case OtherSoftware = 'other_software';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::DemoRequired => 'Demo required',
            self::DemoSetup => 'Demo setup',
            self::TrialRunning => 'Trial running',
            self::NoResponse => 'No response',
            self::CallLater => 'Call later',
            self::NotInterested => 'Not interested',
            self::OtherSoftware => 'Using other software',
            default => str_replace('_', ' ', ucfirst($this->value)),
        };
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $status) => ['value' => $status->value, 'label' => $status->label()], self::cases());
    }
}
