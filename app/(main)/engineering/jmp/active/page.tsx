import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ActiveJourneysView } from '@/components/jmp/active-journeys-view';

export const dynamic = 'force-dynamic';

export default function ActiveJourneysPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/engineering/jmp">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Active Journeys</h1>
          <p className="text-muted-foreground">
            Monitor journeys in progress with real-time checkpoint tracking
          </p>
        </div>
      </div>
      <ActiveJourneysView />
    </div>
  );
}
