import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { POPDF, POPDFProps } from '@/lib/pdf/po-pdf'
import { getCompanySettingsForPDF } from '@/lib/pdf/pdf-utils'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { getClientIp } from '@/lib/api-security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request)
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/purchase-order')
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)) },
      })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    const supabase = await createClient()

    // Fetch PO
    const { data: po, error: poError } = await supabase
      .from('purchase_orders' as never)
      .select('*')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return new Response(JSON.stringify({ error: 'Purchase Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const poData = po as Record<string, unknown>

    // Fetch vendor
    const { data: vendor } = await supabase
      .from('vendors' as never)
      .select('id, name, contact_person')
      .eq('id', poData.vendor_id as string)
      .single()

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('po_line_items' as never)
      .select('*')
      .eq('po_id', id)
      .order('sort_order', { ascending: true })

    // Fetch approver
    let approver: Record<string, unknown> | null = null
    if (poData.approved_by) {
      const { data: a } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('id', poData.approved_by as string)
        .single()
      approver = a as Record<string, unknown> | null
    }

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    const vendorData = vendor as Record<string, unknown> | null

    // Prepare PDF props
    const pdfProps: POPDFProps = {
      po: {
        po_number: poData.po_number as string,
        status: (poData.status as string) || 'draft',
        order_date: poData.order_date as string,
        delivery_date: (poData.delivery_date as string) ?? null,
        delivery_address: (poData.delivery_address as string) ?? null,
        payment_terms: (poData.payment_terms as string) ?? null,
        notes: (poData.notes as string) ?? null,
        subtotal: (poData.subtotal as number) || 0,
        tax_amount: (poData.tax_amount as number) || 0,
        total_amount: (poData.total_amount as number) || 0,
      },
      vendor: vendorData ? { name: vendorData.name as string, contact_person: vendorData.contact_person as string | null } : null,
      lineItems: ((lineItems || []) as Record<string, unknown>[]).map((item) => ({
        item_description: item.item_description as string,
        quantity: (item.quantity as number) || 0,
        unit: (item.unit as string) || 'pcs',
        unit_price: (item.unit_price as number) || 0,
        total_price: (item.total_price as number) || 0,
      })),
      approver: approver ? { full_name: approver.full_name as string } : null,
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<POPDF {...pdfProps} />)

    // Set headers
    const filename = `${poData.po_number as string}.pdf`
    const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    return new Response(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PDF PO] Generation failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF', details }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
