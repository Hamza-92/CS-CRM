import { Link, router } from '@inertiajs/react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export function UserMenu() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    if (!user) {
        return null;
    }

    const item =
        'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-3';

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex h-9 items-center gap-2 rounded-md pr-1.5 pl-1 transition-colors hover:bg-surface-3"
            >
                <Avatar name={user.name} src={user.avatar_url} size="md" />
                <span className="hidden min-w-0 text-left sm:block">
                    <span className="block truncate text-xs leading-4 font-medium text-ink">{user.name}</span>
                    <span className="block truncate text-2xs leading-4 text-ink-3">{user.job_title ?? user.email}</span>
                </span>
                <ChevronDown className="hidden size-3 text-ink-3 sm:block" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
                >
                    <div className="border-b border-line px-3 py-2.5">
                        <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-2xs text-ink-3">{user.email}</p>
                    </div>

                    <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={item}>
                        <User />
                        Profile
                    </Link>

                    <div className="border-t border-line">
                        <button type="button" role="menuitem" onClick={() => router.post('/logout')} className={item}>
                            <LogOut />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
