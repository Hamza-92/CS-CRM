import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedProps } from '@/types';

export type Theme = 'light' | 'dark';

export function useTheme() {
    const { app } = usePage<SharedProps>().props;
    const [theme, setTheme] = useState<Theme>(app.theme ?? 'light');

    useEffect(() => {
        setTheme(app.theme ?? 'light');
    }, [app.theme]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    function toggleTheme() {
        const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);

        router.patch('/theme', { theme: nextTheme }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setTheme(theme),
        });
    }

    return { theme, toggleTheme };
}
