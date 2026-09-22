import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Modal } from '@/components/ui/modal';

function RerenderingModal() {
    const [password, setPassword] = useState('');

    return (
        <Modal open onClose={() => undefined} title="Tenant administrator">
            <label>
                Password
                <input
                    aria-label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
        </Modal>
    );
}

describe('Modal', () => {
    it('preserves the active field when its parent rerenders', async () => {
        const user = userEvent.setup();
        render(<RerenderingModal />);

        await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());

        const password = screen.getByLabelText('Password');
        await user.click(password);
        await user.type(password, 'secret');
        await new Promise((resolve) => window.setTimeout(resolve, 40));

        expect(password).toHaveFocus();
        expect(password).toHaveValue('secret');
    });
});
