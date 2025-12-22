import { getPPETypes } from '@/lib/ppe-actions';
import { PPETypeTable } from '@/components/ppe/ppe-type-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PPETypesPage() {
  const ppeTypes = await getPPETypes(true); // Include inactive for management

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PPE Types Management</h1>
        <p className="text-muted-foreground">
          Configure the types of Personal Protective Equipment tracked in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PPE Types</CardTitle>
          <CardDescription>
            Manage PPE categories, replacement intervals, and mandatory requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PPETypeTable ppeTypes={ppeTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
