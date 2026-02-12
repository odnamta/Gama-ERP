/**
 * Widget-Based Dashboard Page
 * v0.34: Dashboard Widgets & Customization
 * 
 * A customizable dashboard using the widget system.
 * Users can customize their layout and widget visibility.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WidgetDashboard } from '@/components/widgets';

export default async function WidgetDashboardPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user profile for role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, full_name')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const dashboardTitle = getDashboardTitle(profile.role, profile.full_name ?? undefined);

  return (
    <div className="container mx-auto py-6 px-4">
      <WidgetDashboard
        userId={profile.id}
        userRole={profile.role}
        title={dashboardTitle}
      />
    </div>
  );
}

function getDashboardTitle(role: string, name?: string): string {
  const greeting = name ? `Welcome, ${name.split(' ')[0]}` : 'Dashboard';
  
  switch (role) {
    case 'owner':
    case 'admin':
      return `${greeting} - Executive Overview`;
    case 'finance':
      return `${greeting} - Finance Dashboard`;
    case 'sales':
      return `${greeting} - Sales Dashboard`;
    case 'ops':
      return `${greeting} - Operations Dashboard`;
    case 'manager':
      return `${greeting} - Manager Dashboard`;
    default:
      return greeting;
  }
}
