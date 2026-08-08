import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type FilterValue = string | number | boolean | null | undefined;

export function useFilters<T extends Record<string, FilterValue>>(path: string, initial: T) {
    const [values, setValues] = useState<T>(initial);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
    }, []);

    const visit = useCallback(
        (next: T) => {
            const query: Record<string, string> = {};

            for (const [key, value] of Object.entries(next)) {
                if (value === '' || value === null || value === undefined || value === false) {
                    continue;
                }
                query[key] = String(value);
            }

            router.get(path, query, { preserveState: true, preserveScroll: true, replace: true });
        },
        [path],
    );

    const set = useCallback(
        (key: keyof T, value: FilterValue, debounce = 0) => {
            const next = { ...values, [key]: value } as T;
            setValues(next);

            if (timer.current) {
                clearTimeout(timer.current);
            }

            if (debounce > 0) {
                timer.current = setTimeout(() => visit(next), debounce);

                return;
            }

            visit(next);
        },
        [values, visit],
    );

    const setMany = useCallback(
        (patch: Partial<T>) => {
            const next = { ...values, ...patch } as T;
            setValues(next);

            if (timer.current) {
                clearTimeout(timer.current);
            }

            visit(next);
        },
        [values, visit],
    );

    const reset = useCallback(() => {
        const cleared = Object.fromEntries(Object.keys(values).map((key) => [key, ''])) as T;
        setValues(cleared);
        visit(cleared);
    }, [values, visit]);

    return { values, set, setMany, reset };
}
