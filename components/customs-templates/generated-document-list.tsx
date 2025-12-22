'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, FileText, Eye, Download, CheckCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import type { GeneratedDocumentWithRelations, GeneratedDocumentStatus } from '@/types/customs-templates';
import { DOCUMENT_STATUS_LABELS, GENERATED_DOCUMENT_STATUSES, DOCUMENT_TYPE_LABELS } from '@/types/customs-templates';
import { DocumentStatusBadge } from './document-status-badge';
import { updateDocumentStatus } from '@/lib/template-actions';
import { toast } from 'sonner';

interface GeneratedDocumentListProps {
  documents: GeneratedDocumentWithRelations[];
  onGenerateClick: () => void;
}

export function GeneratedDocumentList({ documents: initialDocuments, onGenerateClick }: GeneratedDocumentListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      search === '' ||
      doc.document_number.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (docId: string, newStatus: GeneratedDocumentStatus) => {
    const result = await updateDocumentStatus(docId, newStatus);

    if (result.success) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
      );
      toast.success(`Document ${newStatus === 'final' ? 'finalized' : newStatus}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const getSourceLabel = (doc: GeneratedDocumentWithRelations) => {
    if (doc.pib) return `PIB: ${doc.pib.internal_ref}`;
    if (doc.peb) return `PEB: ${doc.peb.internal_ref}`;
    if (doc.job_order) return `JO: ${doc.job_order.jo_number}`;
    return '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {GENERATED_DOCUMENT_STATUSES.filter(s => s !== 'archived').map((status) => (
                <SelectItem key={status} value={status}>
                  {DOCUMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onGenerateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Document
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document No.</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-sm">
                    {doc.document_number}
                  </TableCell>
                  <TableCell>{doc.template?.template_name || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {doc.template?.document_type
                      ? DOCUMENT_TYPE_LABELS[doc.template.document_type]
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getSourceLabel(doc)}
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/customs/documents/${doc.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {doc.pdf_url && (
                          <DropdownMenuItem asChild>
                            <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {doc.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(doc.id, 'final')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Finalize
                          </DropdownMenuItem>
                        )}
                        {doc.status === 'final' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(doc.id, 'sent')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        {doc.status !== 'archived' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(doc.id, 'archived')}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
