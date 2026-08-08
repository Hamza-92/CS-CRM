import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './data-table';

interface Row {
    id: number;
    name: string;
    code: string;
}

const rows: Row[] = [
    { id: 1, name: 'Counter POS', code: 'CPOS' },
    { id: 2, name: 'Warehouse', code: 'WHS' },
];

const columns = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'code', header: 'Code' },
];

describe('DataTable', () => {
    it('renders headers and rows', () => {
        render(<DataTable columns={columns} data={rows} getRowId={(row) => String(row.id)} />);

        expect(screen.getByRole('columnheader', { name: 'Product' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument();
        expect(screen.getByText('Counter POS')).toBeInTheDocument();
        expect(screen.getByText('WHS')).toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(3);
    });

    it('shows the empty slot when there are no rows', () => {
        render(<DataTable columns={columns} data={[]} empty={<p>Nothing here</p>} />);

        expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('marks the sorted column and toggles direction on click', async () => {
        const onSortChange = vi.fn();

        render(
            <DataTable
                columns={columns}
                data={rows}
                sort={{ column: 'name', direction: 'asc' }}
                sortableColumns={['name']}
                onSortChange={onSortChange}
            />,
        );

        const header = screen.getByRole('columnheader', { name: /Product/ });
        expect(header).toHaveAttribute('aria-sort', 'ascending');

        await userEvent.click(screen.getByRole('button', { name: /Product/ }));

        expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('does not make unsortable columns clickable', () => {
        render(<DataTable columns={columns} data={rows} sortableColumns={['name']} onSortChange={vi.fn()} />);

        expect(screen.queryByRole('button', { name: /Code/ })).not.toBeInTheDocument();
    });
});
