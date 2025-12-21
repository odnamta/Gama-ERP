'use client';

/**
 * Category Card Component
 * v0.38: Help Center & Documentation
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCategoryInfo } from '@/types/help-center';
import { getCategoryUrl } from '@/lib/help-center-utils';

interface CategoryCardProps {
  categoryInfo: HelpCategoryInfo;
}

export function CategoryCard({ categoryInfo }: CategoryCardProps) {
  const { category, label, icon, articleCount } = categoryInfo;

  return (
    <Link href={getCategoryUrl(category)}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col items-center text-center">
          <span className="text-3xl mb-2">{icon}</span>
          <h3 className="font-medium text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
