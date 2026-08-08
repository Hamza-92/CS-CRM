import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Captain Studio CRM';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    strictMode: true,
    progress: {
        color: '#4B5563',
    },
});
