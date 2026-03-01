import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAudit } from '@/lib/audit-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Audit, AuditStatus, AuditRating, ChecklistResponse } from '@/types/audit';
import { AuditDeleteButton } from './audit-delete-button';
import { AddFindingForm } from './add-finding-form';
import { PDFButtons } from '@/components/pdf/pdf-buttons';

export const dynamic = 'force-dynamic';

interface AuditDetailPageProps {
  params: Promise<{ id: string }>;
}

function getStatusVariant(status: AuditStatus) {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'in_progress':
      return 'warning' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

function getStatusLabel(status: AuditStatus) {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function getRatingVariant(rating: AuditRating) {
  switch (rating) {
    case 'pass':
      return 'success' as const;
    case 'conditional_pass':
      return 'warning' as const;
    case 'fail':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

function getRatingLabel(rating: AuditRating) {
  switch (rating) {
    case 'pass':
      return 'Pass';
    case 'conditional_pass':
      return 'Conditional Pass';
    case 'fail':
      return 'Fail';
    default:
      return rating;
  }
}

export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  const { id } = await params;
  const { data: audit, error } = await getAudit(id);

  if (error || !audit) {
    notFound();
  }

  const typedAudit = audit as Audit;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hse/audits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {typedAudit.audit_number || 'Audit Detail'}
            </h1>
            <Badge variant={getStatusVariant(typedAudit.status)}>
              {getStatusLabel(typedAudit.status)}
            </Badge>
            {typedAudit.overall_rating && (
              <Badge variant={getRatingVariant(typedAudit.overall_rating)}>
                {getRatingLabel(typedAudit.overall_rating)}
              </Badge>
            )}
          </div>
          {typedAudit.audit_types && (
            <p className="text-muted-foreground mt-1">
              {typedAudit.audit_types.type_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PDFButtons
            documentType="audit"
            documentId={typedAudit.id}
            documentNumber={typedAudit.audit_number || undefined}
            size="sm"
            variant="outline"
          />
          <AuditDeleteButton
            auditId={typedAudit.id}
            auditNumber={typedAudit.audit_number || 'Audit'}
            status={typedAudit.status}
          />
        </div>
      </div>

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typedAudit.audit_number && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Audit Number</dt>
                <dd className="text-sm mt-1">{typedAudit.audit_number}</dd>
              </div>
            )}
            {typedAudit.audit_types && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Audit Type</dt>
                <dd className="text-sm mt-1">{typedAudit.audit_types.type_name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="text-sm mt-1">
                <Badge variant={getStatusVariant(typedAudit.status)}>
                  {getStatusLabel(typedAudit.status)}
                </Badge>
              </dd>
            </div>
            {typedAudit.location && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Lokasi</dt>
                <dd className="text-sm mt-1">{typedAudit.location}</dd>
              </div>
            )}
            {typedAudit.scheduled_date && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tanggal Terjadwal</dt>
                <dd className="text-sm mt-1">{typedAudit.scheduled_date}</dd>
              </div>
            )}
            {typedAudit.conducted_date && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tanggal Pelaksanaan</dt>
                <dd className="text-sm mt-1">{typedAudit.conducted_date}</dd>
              </div>
            )}
            {typedAudit.auditor_name && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Auditor</dt>
                <dd className="text-sm mt-1">{typedAudit.auditor_name}</dd>
              </div>
            )}
            {typedAudit.overall_score !== null && typedAudit.overall_score !== undefined && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Skor</dt>
                <dd className="text-sm mt-1 font-semibold">{typedAudit.overall_score}%</dd>
              </div>
            )}
            {typedAudit.overall_rating && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Rating</dt>
                <dd className="text-sm mt-1">
                  <Badge variant={getRatingVariant(typedAudit.overall_rating)}>
                    {getRatingLabel(typedAudit.overall_rating)}
                  </Badge>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Summary / Notes */}
      {typedAudit.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{typedAudit.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Checklist Responses */}
      {typedAudit.checklist_responses && typedAudit.checklist_responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checklist Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typedAudit.checklist_responses.map((resp: ChecklistResponse, idx: number) => (
                <div key={idx} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {resp.question || `${resp.section} - Item ${resp.item_index + 1}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Jawaban: {resp.response === true ? 'Ya' : resp.response === false ? 'Tidak' : String(resp.response ?? '-')}
                    </p>
                    {resp.notes && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Catatan: {resp.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Temuan {typedAudit.audit_findings && typedAudit.audit_findings.length > 0
                ? `(${typedAudit.audit_findings.length})`
                : '(0)'}
            </CardTitle>
            {typedAudit.status !== 'cancelled' && (
              <AddFindingForm auditId={typedAudit.id} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {typedAudit.audit_findings && typedAudit.audit_findings.length > 0 ? (
            <div className="space-y-3">
              {typedAudit.audit_findings.map((finding) => (
                <div key={finding.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={finding.severity === 'critical' ? 'destructive' : finding.severity === 'major' ? 'warning' : 'secondary'}>
                      {finding.severity}
                    </Badge>
                    <Badge variant="outline">{finding.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      #{finding.finding_number}
                    </span>
                  </div>
                  <p className="text-sm">{finding.finding_description}</p>
                  {finding.corrective_action && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Tindakan korektif: {finding.corrective_action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada temuan. Klik &quot;Tambah Temuan&quot; untuk menambahkan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Finding Summary Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Temuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{typedAudit.critical_findings}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{typedAudit.major_findings}</p>
              <p className="text-sm text-muted-foreground">Major</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{typedAudit.minor_findings}</p>
              <p className="text-sm text-muted-foreground">Minor</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{typedAudit.observations}</p>
              <p className="text-sm text-muted-foreground">Observations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
