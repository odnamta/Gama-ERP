import { getEmployeePPEStatus } from '@/lib/ppe-actions';
import { ComplianceTable } from '@/components/ppe/compliance-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PPECompliancePage() {
  const statuses = await getEmployeePPEStatus();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PPE Compliance</h1>
        <p className="text-muted-foreground">
          Monitor employee compliance with mandatory PPE requirements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Compliance Status</CardTitle>
          <CardDescription>
            View which employees have all required PPE and identify compliance gaps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceTable statuses={statuses} />
        </CardContent>
      </Card>
    </div>
  );
}
