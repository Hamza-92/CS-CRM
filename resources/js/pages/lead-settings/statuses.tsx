import { LeadSettingsPage } from '@/components/lead-settings/lead-settings-page';
import type { Paginated } from '@/types';

export default function LeadStatuses({ statuses, filters }: { statuses: Paginated<any>; filters: { search: string; status: string } }) { return <LeadSettingsPage kind="statuses" items={statuses} filters={filters} />; }
