'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QUICK_QUESTIONS } from '@/types/ai-insights';

interface AIQueryInputProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export function AIQueryInput({
  onSubmit,
  isLoading,
  placeholder = 'Ask me anything about your business...',
}: AIQueryInputProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;
    await onSubmit(query.trim());
    setQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickQuestion = async (questionQuery: string) => {
    if (isLoading) return;
    setQuery(questionQuery);
    await onSubmit(questionQuery);
    setQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Main Input Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {placeholder}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What was our profit margin last quarter?"
              className="pr-10 bg-white dark:bg-gray-900"
              disabled={isLoading}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              'Ask'
            )}
          </Button>
        </div>

        {/* Quick Questions */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <Button
                key={q.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestion(q.query)}
                disabled={isLoading}
                className="text-xs bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                {q.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
