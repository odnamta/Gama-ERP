/**
 * Admin Changelog Page
 * Task 7.4: Create admin changelog page
 * Requirements: 7.1, 7.5
 * 
 * - Check admin access (owner, director, sysadmin)
 * - Redirect non-admins to their dashboard
 * - Include entry form and entry list
 */

import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/permissions-server';
import { ADMIN_ROLES } from '@/lib/permissions';
import { getDashboardPath } from '@/lib/navigation';
import { getChangelogEntries } from './actions';
import { ChangelogEntryForm } from '@/components/changelog/changelog-entry-form';
import { ChangelogEntryList } from '@/components/changelog/changelog-entry-list';
import { Sparkles } from 'lucide-react';
import type { ChangelogEntry } from '@/types/changelog';

export const metadata = {
  title: 'Manage Changelog | GAMA ERP',
  description: 'Add and manage changelog entries',
};

export default async function AdminChangelogPage() {
  // Requirement 7.1: Check admin access
  const profile = await getUserProfile();

  // Requirement 7.5: Redirect non-admins to their dashboard
  if (!profile || !(ADMIN_ROLES as readonly string[]).includes(profile.role)) {
    const dashboardPath = getDashboardPath(profile?.role || 'ops');
    redirect(dashboardPath);
  }
  
  // Fetch existing entries
  const entries = await getChangelogEntries() as ChangelogEntry[];
  
  return (
    <div className="container max-w-4xl py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Manage Changelog</h1>
        </div>
        <p className="text-muted-foreground">
          Add, edit, and delete changelog entries to keep users informed about updates.
        </p>
      </div>
      
      {/* Entry Form */}
      <div className="mb-8">
        <ChangelogEntryForm />
      </div>
      
      {/* Entry List */}
      <ChangelogEntryList entries={entries} />
    </div>
  );
}
