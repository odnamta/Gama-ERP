'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMyOpenTicketCount } from '@/app/actions/feedback';
import { FeedbackModal } from './feedback-modal';

interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [openTicketCount, setOpenTicketCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const result = await getMyOpenTicketCount();
      if (result.success && result.data !== undefined) {
        setOpenTicketCount(result.data);
      }
    }
    fetchCount();
  }, []);

  const handleSuccess = () => {
    // Refresh count after successful submission
    getMyOpenTicketCount().then((result) => {
      if (result.success && result.data !== undefined) {
        setOpenTicketCount(result.data);
      }
    });
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/feedback');
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50 ${className || ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Submit feedback"
      >
        <MessageSquarePlus className="h-6 w-6" />
        {openTicketCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1 cursor-pointer hover:bg-destructive/80"
            onClick={handleBadgeClick}
          >
            {openTicketCount > 99 ? '99+' : openTicketCount}
          </Badge>
        )}
      </Button>

      <FeedbackModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
