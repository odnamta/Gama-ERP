'use client';

/**
 * Help Article Card Component
 * v0.38: Help Center & Documentation
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpArticle } from '@/types/help-center';
import { getArticleUrl, truncateText } from '@/lib/help-center-utils';

interface HelpArticleCardProps {
  article: HelpArticle;
  highlightedTitle?: string;
  highlightedSummary?: string;
}

export function HelpArticleCard({ 
  article, 
  highlightedTitle,
  highlightedSummary 
}: HelpArticleCardProps) {
  const displayTitle = highlightedTitle || article.title;
  const displaySummary = highlightedSummary || article.summary;

  return (
    <Link href={getArticleUrl(article.articleSlug)}>
      <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle 
            className="text-base font-medium"
            dangerouslySetInnerHTML={{ __html: displayTitle }}
          />
        </CardHeader>
        <CardContent className="pt-0">
          {displaySummary && (
            <p 
              className="text-sm text-muted-foreground mb-3"
              dangerouslySetInnerHTML={{ 
                __html: truncateText(displaySummary, 150) 
              }}
            />
          )}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
