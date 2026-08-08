import { LeadSettingsPage } from '@/components/lead-settings/lead-settings-page';
import type { Paginated } from '@/types';

export default function LeadSources({ sources, filters }: { sources: Paginated<any>; filters: { search: string; status: string } }) { return <LeadSettingsPage kind="sources" items={sources} filters={filters} />; }
