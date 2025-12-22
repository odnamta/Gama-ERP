import { getReplacementDue } from '@/lib/ppe-actions';
import { ReplacementDueTable } from '@/components/ppe/replacement-due-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PPEReplacementPage() {
  const replacements = await getReplacementDue();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PPE Replacement Schedule</h1>
        <p className="text-muted-foreground">
          Track PPE items that are due or overdue for replacement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replacement Due</CardTitle>
          <CardDescription>
            PPE items due for replacement within the next 30 days or already overdue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReplacementDueTable replacements={replacements} />
        </CardContent>
      </Card>
    </div>
  );
}
