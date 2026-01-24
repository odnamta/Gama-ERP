'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, User } from 'lucide-react';
import { SafetyDocument } from '@/types/safety-document';
import { DocumentStatusBadge } from './document-status-badge';
import { ValidityBadge } from './validity-badge';
import { formatDate } from '@/lib/utils/format';

interface DocumentCardProps {
  document: SafetyDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link href={`/hse/documents/${document.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-mono">
                {document.documentNumber}
              </span>
            </div>
            <DocumentStatusBadge status={document.status} />
          </div>
          <CardTitle className="text-lg mt-2">{document.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{document.categoryName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Efektif: {formatDate(document.effectiveDate)}</span>
            </div>

            {document.expiryDate && document.validityStatus && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Kadaluarsa:</span>
                <ValidityBadge 
                  status={document.validityStatus} 
                  daysUntilExpiry={document.daysUntilExpiry}
                />
              </div>
            )}

            {document.preparedByName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{document.preparedByName}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Versi {document.version} (Rev. {document.revisionNumber})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
