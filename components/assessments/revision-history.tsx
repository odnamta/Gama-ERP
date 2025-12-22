'use client';

// components/assessments/revision-history.tsx
// Revision history for Technical Assessments (v0.58)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Copy,
  History,
  ExternalLink,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { TechnicalAssessment } from '@/types/assessment';
import { getStatusColor, getStatusLabel, formatDate, canCreateRevision } from '@/lib/assessment-utils';
import { createRevision, getAssessment } from '@/lib/assessment-actions';

interface RevisionHistoryProps {
  assessment: TechnicalAssessment;
}

interface RevisionItem {
  id: string;
  assessment_number: string;
  revision_number: number;
  status: string;
  created_at: string;
  revision_notes: string | null;
}

export function RevisionHistory({ assessment }: RevisionHistoryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionChain, setRevisionChain] = useState<RevisionItem[]>([]);
  const [loadingChain, setLoadingChain] = useState(true);

  const canRevise = canCreateRevision(assessment.status);

  // Build revision chain
  useEffect(() => {
    const buildRevisionChain = async () => {
      setLoadingChain(true);
      const chain: RevisionItem[] = [];
      
      // Add current assessment
      chain.push({
        id: assessment.id,
        assessment_number: assessment.assessment_number,
        revision_number: assessment.revision_number,
        status: assessment.status,
        created_at: assessment.created_at,
        revision_notes: assessment.revision_notes,
      });

      // Traverse previous revisions
      let previousId = assessment.previous_revision_id;
      while (previousId) {
        try {
          const prev = await getAssessment(previousId);
          if (prev) {
            chain.push({
              id: prev.id,
              assessment_number: prev.assessment_number,
              revision_number: prev.revision_number,
              status: prev.status,
              created_at: prev.created_at,
              revision_notes: prev.revision_notes,
            });
            previousId = prev.previous_revision_id;
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      setRevisionChain(chain.reverse());
      setLoadingChain(false);
    };

    buildRevisionChain();
  }, [assessment]);

  const handleCreateRevision = async () => {
    setLoading(true);
    try {
      const result = await createRevision(assessment.id, revisionNotes);
      if (result.success && result.data) {
        setShowRevisionDialog(false);
        router.push(`/engineering/assessments/${result.data.id}`);
      }
    } catch (error) {
      console.error('Error creating revision:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Revision History
            </CardTitle>
            <CardDescription>
              Track changes across assessment revisions
            </CardDescription>
          </div>
          {canRevise && (
            <Button onClick={() => setShowRevisionDialog(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Create Revision
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadingChain ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : revisionChain.length === 1 && !assessment.previous_revision_id ? (
          <div className="text-center py-8">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">This is the original assessment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Revision {assessment.revision_number}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {revisionChain.map((rev, index) => {
              const isCurrent = rev.id === assessment.id;
              const isLatest = index === revisionChain.length - 1;

              return (
                <div
                  key={rev.id}
                  className={`relative flex items-start gap-4 p-4 rounded-lg border ${
                    isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'
                  }`}
                >
                  {/* Timeline connector */}
                  {index < revisionChain.length - 1 && (
                    <div className="absolute left-7 top-14 w-0.5 h-8 bg-gray-200" />
                  )}

                  {/* Revision number badge */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {rev.revision_number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rev.assessment_number}</span>
                      <Badge className={getStatusColor(rev.status as any)}>
                        {getStatusLabel(rev.status as any)}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="outline" className="text-blue-600">
                          Current
                        </Badge>
                      )}
                      {isLatest && !isCurrent && (
                        <Badge variant="outline">Latest</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created: {formatDate(rev.created_at)}
                    </p>
                    {rev.revision_notes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {rev.revision_notes}
                      </p>
                    )}
                  </div>

                  {/* Link to view */}
                  {!isCurrent && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/engineering/assessments/${rev.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Revision</DialogTitle>
            <DialogDescription>
              Create a new revision of this assessment. The current version will be marked as superseded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>Current: <strong>{assessment.assessment_number}</strong> (Rev {assessment.revision_number})</p>
              <p className="text-muted-foreground mt-1">
                New revision will be Rev {assessment.revision_number + 1}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Revision Notes *</Label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Describe what changes will be made in this revision..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRevision}
              disabled={loading || !revisionNotes.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Create Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
