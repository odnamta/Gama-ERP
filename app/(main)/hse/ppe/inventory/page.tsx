import { getPPEInventory, getPPETypes } from '@/lib/ppe-actions';
import { InventoryTable } from '@/components/ppe/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PPEInventoryPage() {
  const [inventory, ppeTypes] = await Promise.all([
    getPPEInventory(),
    getPPETypes(),
  ]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PPE Inventory</h1>
        <p className="text-muted-foreground">
          Track stock levels and record purchases for Personal Protective Equipment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>
            Monitor inventory quantities and reorder alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory} ppeTypes={ppeTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
