import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { PJOPDF, PJOPDFProps } from '@/lib/pdf/pjo-pdf'
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
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/pjo')
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

    // Fetch PJO - use simple query to avoid nested join failures
    const { data: pjo, error: pjoError } = await supabase
      .from('proforma_job_orders')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (pjoError || !pjo) {
      return new Response(JSON.stringify({ error: 'PJO not found', details: pjoError?.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch project and customer separately to avoid nested join failures
    let projectName = 'Unknown Project'
    let customerName = 'Unknown Customer'
    if (pjo.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, customer_id')
        .eq('id', pjo.project_id)
        .single()
      if (project) {
        projectName = project.name || 'Unknown Project'
        if (project.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', project.customer_id)
            .single()
          if (customer) {
            customerName = customer.name || 'Unknown Customer'
          }
        }
      }
    }

    // Fetch revenue items
    const { data: revenueItems } = await supabase
      .from('pjo_revenue_items')
      .select('*')
      .eq('pjo_id', id)
      .order('created_at', { ascending: true })

    // Fetch cost items
    const { data: costItems } = await supabase
      .from('pjo_cost_items')
      .select('*')
      .eq('pjo_id', id)
      .order('created_at', { ascending: true })

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    // Prepare data for PDF with null safety
    const pdfProps: PJOPDFProps = {
      pjo: {
        pjo_number: pjo.pjo_number || 'DRAFT',
        status: pjo.status || 'draft',
        commodity: pjo.commodity ?? null,
        quantity: pjo.quantity ?? null,
        quantity_unit: pjo.quantity_unit ?? null,
        pol: pjo.pol ?? null,
        pod: pjo.pod ?? null,
        etd: pjo.etd ?? null,
        eta: pjo.eta ?? null,
        carrier_type: pjo.carrier_type ?? null,
        total_revenue: pjo.total_revenue ?? null,
        total_expenses: pjo.total_expenses ?? null,
        notes: pjo.notes ?? null,
        created_at: pjo.created_at ?? null,
      },
      customer: {
        name: customerName,
      },
      project: {
        name: projectName,
      },
      revenueItems: (revenueItems || []).map(item => ({
        description: item.description || '-',
        quantity: item.quantity ?? null,
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal ?? null,
        notes: item.notes ?? null,
      })),
      costItems: (costItems || []).map(item => ({
        category: item.category || '-',
        description: item.description || '-',
        estimated_amount: item.estimated_amount || 0,
      })),
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<PJOPDF {...pdfProps} />)

    // Set headers
    const filename = `${pjo.pjo_number}.pdf`
    const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    return new Response(buffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('PJO PDF generation failed:', errorMessage)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
