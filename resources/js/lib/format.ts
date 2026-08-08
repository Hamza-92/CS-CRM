import type { BadgeTone } from '@/components/ui/badge';

const LOCALE = 'en-GB';

export function relativeTime(value: string) {
    const then = new Date(value).getTime();
    const seconds = Math.round((Date.now() - then) / 1000);

    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;

    return new Date(value).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function shortDate(value: string | null) {
    if (!value) return '—';

    return new Date(value).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateTime(value: string) {
    return new Date(value).toLocaleString(LOCALE, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function money(amount: string | number, currency: string) {
    const value = Number(amount);

    if (Number.isNaN(value)) {
        return `${currency} ${amount}`;
    }

    return `${currency} ${value.toLocaleString(LOCALE, { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

export function toneForEvent(event: string): BadgeTone {
    if (event.endsWith('.deleted') || event.endsWith('.archived')) return 'bad';
    if (event.endsWith('.created') || event.endsWith('.restored')) return 'ok';
    if (event.endsWith('.updated')) return 'info';
    if (event.startsWith('auth.')) return 'alt';

    return 'neutral';
}

export function toneForCycle(cycle: string): BadgeTone {
    switch (cycle) {
        case 'trial':
            return 'info';
        case 'lifetime':
            return 'alt';
        case 'annual':
            return 'ok';
        case 'custom':
            return 'warn';
        default:
            return 'neutral';
    }
}
