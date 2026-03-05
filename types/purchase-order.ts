export type POStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'received' | 'cancelled';

export interface POLineItem {
  id?: string;
  po_id?: string;
  item_description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes: string | null;
  sort_order: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  order_date: string;
  delivery_date: string | null;
  status: POStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  delivery_address: string | null;
  payment_terms: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  received_at: string | null;
  received_by: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  vendor?: { id: string; name: string; contact_person: string | null };
  line_items?: POLineItem[];
  approver?: { id: string; full_name: string } | null;
}

export interface CreatePOInput {
  vendor_id: string;
  order_date: string;
  delivery_date?: string;
  delivery_address?: string;
  payment_terms?: string;
  notes?: string;
  line_items: Omit<POLineItem, 'id' | 'po_id'>[];
}

export interface UpdatePOInput extends Partial<CreatePOInput> {}

export interface POFilters {
  search?: string;
  status?: POStatus | 'all';
}
