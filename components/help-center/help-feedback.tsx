'use client';

/**
 * Help Feedback Component
 * v0.38: Help Center & Documentation
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordFeedback } from '@/lib/help-center-actions';
import { FeedbackType } from '@/types/help-center';

interface HelpFeedbackProps {
  articleId: string;
}

export function HelpFeedback({ articleId }: HelpFeedbackProps) {
  const [submitted, setSubmitted] = useState<FeedbackType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFeedback = async (type: FeedbackType) => {
    if (submitted || isLoading) return;

    setIsLoading(true);
    try {
      const result = await recordFeedback(articleId, type);
      if (result.success) {
        setSubmitted(type);
      }
    } catch (error) {
      console.error('Error recording feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('helpful')}
          disabled={isLoading}
          className="gap-1"
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('not_helpful')}
          disabled={isLoading}
          className="gap-1"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  );
}
