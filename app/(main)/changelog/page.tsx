/**
 * Changelog Page
 * Task 4.4: Create changelog page
 * Requirements: 3.1, 9.2
 * 
 * Server Component for optimal performance (Requirement 9.2)
 */

import { createClient } from '@/lib/supabase/server';
import { groupEntriesByMonth } from '@/lib/changelog-utils';
import { ChangelogTimeline } from '@/components/changelog/changelog-timeline';
import { LastViewedUpdater } from '@/components/changelog/last-viewed-updater';
import { Sparkles } from 'lucide-react';
import type { ChangelogEntry } from '@/types/changelog';

export const metadata = {
  title: "What's New | GAMA ERP",
  description: 'View the latest updates and features in GAMA ERP',
};

export default async function ChangelogPage() {
  const supabase = await createClient();

  // Requirement 3.1: Fetch entries ordered by published_at DESC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await supabase
    .from('changelog_entries')
    .select('*')
    .order('published_at', { ascending: false });

  const entries = (result.data || []) as ChangelogEntry[];
  const groupedEntries = groupEntriesByMonth(entries);

  return (
    <div className="container max-w-4xl py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">What&apos;s New</h1>
        </div>
        <p className="text-muted-foreground">
          Stay up to date with the latest features, improvements, and fixes in GAMA ERP.
        </p>
      </div>

      {/* Timeline Display */}
      <ChangelogTimeline entries={groupedEntries} />

      {/* Client component to update localStorage - Requirement 6.3 */}
      <LastViewedUpdater />
    </div>
  );
}
