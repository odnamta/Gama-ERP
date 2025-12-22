import {
  getPPEDashboardMetrics,
  getReplacementDue,
  getLowStockItems,
  getEmployeePPEStatus,
} from '@/lib/ppe-actions';
import { getEmployeeComplianceSummary } from '@/lib/ppe-utils';
import { PPEDashboardCards } from '@/components/ppe/ppe-dashboard-cards';
import { PPEAlertsList } from '@/components/ppe/ppe-alerts-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HardHat, Package, RefreshCw, Users, Settings } from 'lucide-react';

export default async function PPEDashboardPage() {
  const [metrics, replacementDue, lowStockItems, employeeStatuses] = await Promise.all([
    getPPEDashboardMetrics(),
    getReplacementDue(),
    getLowStockItems(),
    getEmployeePPEStatus(),
  ]);

  const overdueReplacements = replacementDue.filter(r => r.days_overdue > 0);
  const complianceSummaries = getEmployeeComplianceSummary(employeeStatuses);
  const nonCompliantEmployees = complianceSummaries.filter(e => !e.isCompliant);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PPE Management</h1>
          <p className="text-muted-foreground">
            Track Personal Protective Equipment issuance, condition, and compliance.
          </p>
        </div>
      </div>

      <PPEDashboardCards metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common PPE management tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/hse/ppe/issuance">
                  <HardHat className="mr-2 h-4 w-4" />
                  Issue PPE to Employee
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/hse/ppe/inventory">
                  <Package className="mr-2 h-4 w-4" />
                  Record Purchase
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/hse/ppe/compliance">
                  <Users className="mr-2 h-4 w-4" />
                  Check Compliance
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/hse/ppe/replacement">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  View Replacement Schedule
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/hse/ppe/types">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage PPE Types
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
          <PPEAlertsList
            overdueReplacements={overdueReplacements}
            lowStockItems={lowStockItems}
            nonCompliantEmployees={nonCompliantEmployees}
          />
        </div>
      </div>
    </div>
  );
}
