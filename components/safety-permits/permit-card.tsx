'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, User } from 'lucide-react';
import { SafetyPermit } from '@/types/safety-document';
import { PermitStatusBadge } from './permit-status-badge';
import { PermitTypeBadge } from './permit-type-badge';
import { formatDate } from '@/lib/utils/format';

interface PermitCardProps {
  permit: SafetyPermit;
}

export function PermitCard({ permit }: PermitCardProps) {
  return (
    <Link href={`/hse/permits/${permit.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-mono">
              {permit.permitNumber}
            </span>
            <PermitStatusBadge status={permit.status} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <PermitTypeBadge type={permit.permitType} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <CardTitle className="text-base line-clamp-2">
              {permit.workDescription}
            </CardTitle>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{permit.workLocation}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(permit.validFrom)} - {formatDate(permit.validTo)}
              </span>
            </div>

            {permit.requestedByName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{permit.requestedByName}</span>
              </div>
            )}

            {permit.jobOrderNumber && (
              <div className="text-muted-foreground">
                JO: {permit.jobOrderNumber}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
