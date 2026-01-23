/**
 * Changelog Timeline Component
 * Task 4.2: Create changelog timeline component
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBadge } from './category-badge';
import { formatPublishedDate } from '@/lib/changelog-utils';
import type { GroupedChangelogEntries } from '@/types/changelog';
import { Sparkles } from 'lucide-react';

interface ChangelogTimelineProps {
  entries: GroupedChangelogEntries[];
}

/**
 * Displays changelog entries in a timeline format grouped by month/year
 * - Requirement 3.2: Group entries by month and year with clear section headers
 * - Requirement 3.3: Display version, title, description, category badge, published date
 * - Requirement 3.4: Render description content as markdown (simplified)
 * - Requirement 3.5: Visually highlight major updates
 */
export function ChangelogTimeline({ entries }: ChangelogTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No changelog entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {entries.map((group) => (
        <div key={group.monthYear}>
          {/* Month/Year Section Header - Requirement 3.2 */}
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 sticky top-0 bg-background py-2">
            {group.monthYear}
          </h2>
          
          <div className="space-y-4">
            {group.entries.map((entry) => (
              <Card 
                key={entry.id}
                className={entry.is_major ? 'border-primary border-2 shadow-md' : ''}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Major Update Indicator - Requirement 3.5 */}
                      {entry.is_major && (
                        <Sparkles className="h-5 w-5 text-primary" />
                      )}
                      
                      {/* Version Badge */}
                      {entry.version && (
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {entry.version}
                        </span>
                      )}
                      
                      {/* Category Badge - Requirement 3.3 */}
                      <CategoryBadge category={entry.category} />
                    </div>
                    
                    {/* Published Date - Requirement 3.3 */}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatPublishedDate(entry.published_at)}
                    </span>
                  </div>
                  
                  {/* Title - Requirement 3.3 */}
                  <CardTitle className={`text-xl ${entry.is_major ? 'text-primary' : ''}`}>
                    {entry.title}
                  </CardTitle>
                </CardHeader>
                
                {/* Description - Requirement 3.3, 3.4 */}
                {entry.description && (
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
