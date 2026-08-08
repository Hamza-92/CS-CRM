import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useToast } from '@/components/toast';
import type { SharedProps } from '@/types';

export function Flash() {
    const { flash } = usePage<SharedProps>().props;
    const { toast } = useToast();
    const lastMessage = useRef<string | null>(null);
    const message = flash.success ?? flash.error ?? flash.warning ?? flash.info;

    useEffect(() => {
        if (!message || message === lastMessage.current) return;
        lastMessage.current = message;
        toast(message, flash.error ? 'error' : flash.warning ? 'warning' : flash.info ? 'info' : 'success');
    }, [flash.error, flash.info, flash.warning, message, toast]);

    return null;
}
