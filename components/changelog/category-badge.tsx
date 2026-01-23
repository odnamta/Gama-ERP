/**
 * Category Badge Component
 * Task 4.1: Create category badge component
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { Badge } from '@/components/ui/badge';
import { getCategoryBadgeColor, formatCategoryLabel } from '@/lib/changelog-utils';
import type { ChangelogCategory } from '@/types/changelog';

interface CategoryBadgeProps {
  category: ChangelogCategory;
  className?: string;
}

/**
 * Displays a color-coded badge for changelog entry categories
 * - feature: blue (Requirement 4.1)
 * - bugfix: red (Requirement 4.2)
 * - improvement: green (Requirement 4.3)
 * - security: yellow (Requirement 4.4)
 */
export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const colorClasses = getCategoryBadgeColor(category);
  const label = formatCategoryLabel(category);

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClasses} ${className}`}
    >
      {label}
    </Badge>
  );
}
