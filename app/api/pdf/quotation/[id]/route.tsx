import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotationPDF } from '@/lib/pdf/quotation-pdf'
import { getCompanySettingsForPDF } from '@/lib/pdf/pdf-utils'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { getClientIp } from '@/lib/api-security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for expensive PDF generation
    const clientIp = getClientIp(request)
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/quotation')
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

    // Fetch quotation with relations - use separate queries to avoid deep nesting errors
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (quotationError || !quotation) {
      return new Response(JSON.stringify({ error: 'Quotation not found', details: quotationError?.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch customer separately to avoid nested query failures
    let customerData: Record<string, string> | null = null
    if (quotation.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, email, phone, address')
        .eq('id', quotation.customer_id)
        .single()
      customerData = customer as Record<string, string> | null
    }

    // Fetch revenue items separately
    const { data: rawRevenueItems } = await supabase
      .from('quotation_revenue_items')
      .select('*')
      .eq('quotation_id', id)
      .order('display_order', { ascending: true })

    // Fetch cost items separately
    const { data: rawCostItems } = await supabase
      .from('quotation_cost_items')
      .select('*')
      .eq('quotation_id', id)
      .order('display_order', { ascending: true })

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    // Map revenue items with null safety
    const revenueItems = (rawRevenueItems || [])
      .map((item: Record<string, unknown>) => ({
        category: (item.category as string) || '-',
        description: (item.description as string) || '-',
        quantity: item.quantity as number | null,
        unit: item.unit as string | null,
        unit_price: (item.unit_price as number) || 0,
        subtotal: item.subtotal as number | null,
      }))

    // Map cost items with null safety
    const costItems = (rawCostItems || [])
      .map((item: Record<string, unknown>) => ({
        category: (item.category as string) || '-',
        description: (item.description as string) || '-',
        estimated_amount: (item.estimated_amount as number) || 0,
        vendor_name: item.vendor_name as string | null,
      }))

    // Prepare data for PDF with comprehensive null safety
    const pdfProps = {
      quotation: {
        quotation_number: quotation.quotation_number || 'DRAFT',
        title: quotation.title || '-',
        created_at: quotation.created_at || new Date().toISOString(),
        rfq_number: quotation.rfq_number || null,
        rfq_date: quotation.rfq_date || null,
        rfq_deadline: quotation.rfq_deadline || null,
        origin: quotation.origin || '-',
        destination: quotation.destination || '-',
        commodity: quotation.commodity || null,
        cargo_weight_kg: quotation.cargo_weight_kg || null,
        cargo_length_m: quotation.cargo_length_m || null,
        cargo_width_m: quotation.cargo_width_m || null,
        cargo_height_m: quotation.cargo_height_m || null,
        estimated_shipments: quotation.estimated_shipments || null,
        total_revenue: quotation.total_revenue || 0,
        total_cost: quotation.total_cost || 0,
        gross_profit: quotation.gross_profit || 0,
        profit_margin: quotation.profit_margin || 0,
        notes: quotation.notes || null,
        status: quotation.status || null,
      },
      customer: {
        name: customerData?.name || 'Unknown Customer',
        email: customerData?.email,
        phone: customerData?.phone,
        address: customerData?.address,
      },
      revenueItems,
      costItems,
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<QuotationPDF {...pdfProps} />)

    // Set headers
    const filename = `${quotation.quotation_number}.pdf`
    const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    return new Response(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Quotation PDF generation failed:', errorMessage)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
