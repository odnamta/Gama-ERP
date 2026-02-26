import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { SuratJalanPDF, SuratJalanPDFProps } from '@/lib/pdf/surat-jalan-pdf'
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
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/surat-jalan')
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

    // Fetch surat jalan with job order relation
    const { data: suratJalan, error: sjError } = await supabase
      .from('surat_jalan')
      .select(`
        *,
        job_orders (id, jo_number)
      `)
      .eq('id', id)
      .single()

    if (sjError || !suratJalan) {
      return new Response(JSON.stringify({ error: 'Surat Jalan not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    // Prepare data for PDF
    const pdfProps: SuratJalanPDFProps = {
      suratJalan: {
        sj_number: suratJalan.sj_number,
        delivery_date: suratJalan.delivery_date,
        vehicle_plate: suratJalan.vehicle_plate ?? undefined,
        driver_name: suratJalan.driver_name ?? undefined,
        driver_phone: suratJalan.driver_phone ?? undefined,
        origin: suratJalan.origin ?? undefined,
        destination: suratJalan.destination ?? undefined,
        cargo_description: suratJalan.cargo_description ?? undefined,
        quantity: suratJalan.quantity ?? undefined,
        quantity_unit: suratJalan.quantity_unit ?? undefined,
        weight_kg: suratJalan.weight_kg ?? undefined,
        sender_name: suratJalan.sender_name ?? undefined,
        receiver_name: suratJalan.receiver_name ?? undefined,
        notes: suratJalan.notes ?? undefined,
      },
      jobOrder: {
        jo_number: suratJalan.job_orders?.jo_number || '-',
      },
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<SuratJalanPDF {...pdfProps} />)

    // Set headers
    const filename = `${suratJalan.sj_number}.pdf`
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
