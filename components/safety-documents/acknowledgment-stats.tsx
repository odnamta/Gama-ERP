'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import { AcknowledgmentStats } from '@/types/safety-document';

interface AcknowledgmentStatsCardProps {
  stats: AcknowledgmentStats;
}

export function AcknowledgmentStatsCard({ stats }: AcknowledgmentStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Pengakuan Dokumen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {stats.totalAcknowledged} dari {stats.totalRequired} karyawan
            </span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
