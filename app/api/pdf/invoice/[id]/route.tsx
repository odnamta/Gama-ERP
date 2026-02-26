import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF, InvoicePDFProps } from '@/lib/pdf/invoice-pdf'
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
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/invoice')
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

    // Fetch invoice with relations
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name, email, address),
        job_orders (id, jo_number, pjo_id)
      `)
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('line_number', { ascending: true })

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    // Prepare data for PDF
    const pdfProps: InvoicePDFProps = {
      invoice: {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date || invoice.created_at || new Date().toISOString(),
        due_date: invoice.due_date || new Date().toISOString(),
        subtotal: invoice.subtotal || 0,
        tax_amount: invoice.tax_amount || 0,
        total_amount: invoice.total_amount || 0,
        term_description: invoice.term_description ?? undefined,
        notes: invoice.notes ?? undefined,
      },
      customer: {
        name: invoice.customers?.name || 'Unknown Customer',
        address: invoice.customers?.address ?? undefined,
      },
      jobOrder: {
        jo_number: invoice.job_orders?.jo_number || '-',
      },
      lineItems: (lineItems || []).map(item => ({
        description: item.description,
        quantity: item.quantity || 1,
        unit: item.unit ?? undefined,
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal || (item.quantity || 1) * (item.unit_price || 0),
      })),
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<InvoicePDF {...pdfProps} />)

    // Set headers
    const filename = `${invoice.invoice_number}.pdf`
    const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
