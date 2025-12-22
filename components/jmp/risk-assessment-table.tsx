'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { JmpRiskAssessment } from '@/types/jmp';
import { formatRiskLevel, getRiskLevelColor } from '@/lib/jmp-utils';

interface RiskAssessmentTableProps {
  risks: JmpRiskAssessment[];
  onEdit?: (risk: JmpRiskAssessment) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

const formatCategory = (category: string) => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function RiskAssessmentTable({ risks, onEdit, onDelete, readonly }: RiskAssessmentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Likelihood</TableHead>
            <TableHead>Consequence</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead>Control Measures</TableHead>
            {!readonly && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readonly ? 6 : 7} className="text-center py-8 text-muted-foreground">
                No risks identified
              </TableCell>
            </TableRow>
          ) : (
            risks.map((risk) => (
              <TableRow 
                key={risk.id}
                className={risk.riskLevel === 'high' || risk.riskLevel === 'extreme' ? 'bg-red-50' : ''}
              >
                <TableCell className="font-medium">
                  {formatCategory(risk.riskCategory)}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {risk.riskDescription}
                </TableCell>
                <TableCell className="capitalize">{risk.likelihood.replace('_', ' ')}</TableCell>
                <TableCell className="capitalize">{risk.consequence}</TableCell>
                <TableCell>
                  <Badge className={getRiskLevelColor(risk.riskLevel)}>
                    {formatRiskLevel(risk.riskLevel)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  {risk.controlMeasures}
                </TableCell>
                {!readonly && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(risk)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(risk.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
