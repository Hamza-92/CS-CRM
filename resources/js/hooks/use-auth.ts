import { usePage } from '@inertiajs/react';
import type { Ability, SharedProps } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedProps>().props;

    return {
        user: auth.user,
        can: (ability: Ability) => auth.can[ability] === true,
        hasRole: (role: string) => auth.user?.roles.includes(role) ?? false,
    };
}
