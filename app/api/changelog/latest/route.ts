/**
 * API Route: Get Latest Changelog Entry
 * Task 5.3: Create API route for latest changelog entry
 * Requirement 6.2: Return latest entry's published_at timestamp
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the latest entry's published_at timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await supabase
      .from('changelog_entries')
      .select('published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();
    
    if (result.error) {
      // No entries found or other error
      return NextResponse.json({ published_at: null });
    }
    
    return NextResponse.json({ published_at: result.data?.published_at || null });
  } catch {
    return NextResponse.json({ published_at: null }, { status: 500 });
  }
}
