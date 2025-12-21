'use client';

/**
 * Contextual Help Popover Component
 * v0.38: Help Center & Documentation
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { HelpArticle } from '@/types/help-center';
import { getContextualArticles } from '@/lib/help-center-actions';
import { getArticleUrl } from '@/lib/help-center-utils';

interface ContextualHelpPopoverProps {
  userRole: string;
}

export function ContextualHelpPopover({ userRole }: ContextualHelpPopoverProps) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getContextualArticles(pathname, userRole)
        .then(setArticles)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, pathname, userRole]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Help for this page</h4>
            <Link href="/help">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                Help Center
              </Button>
            </Link>
          </div>

          <Separator />

          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Related articles for this page:
              </p>
              {articles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={getArticleUrl(article.articleSlug)}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                    <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{article.title}</p>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No specific help for this page.
              </p>
              <div className="space-y-2">
                <Link href="/help/articles/getting-started" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Getting Started Guide
                  </Button>
                </Link>
                <Link href="/help" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse All Help
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> for keyboard shortcuts
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
