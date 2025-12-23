'use client';

import { Clock, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AIQueryHistory } from '@/types/ai-insights';
import { formatRelativeTime } from '@/lib/ai-insights-utils';

interface AIQueryHistoryProps {
  history: AIQueryHistory[];
  onRerun: (query: string) => void;
  isLoading: boolean;
}

export function AIQueryHistoryList({ history, onRerun, isLoading }: AIQueryHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recent Queries</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No queries yet. Ask a question to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Recent Queries</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 p-4 pt-0">
            {history.map((item) => (
              <div
                key={item.id}
                className="group flex items-start justify-between gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    &ldquo;{item.natural_query}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.created_at)}
                    {item.was_helpful !== null && (
                      <span className="ml-2">
                        {item.was_helpful ? '👍' : '👎'}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRerun(item.natural_query)}
                  disabled={isLoading}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
