import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { BeritaAcaraPDF, BeritaAcaraPDFProps } from '@/lib/pdf/berita-acara-pdf'
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
    const rateCheck = await checkRateLimit(clientIp, '/api/pdf/berita-acara')
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

    // Fetch berita acara with job order relation
    const { data: beritaAcara, error: baError } = await supabase
      .from('berita_acara')
      .select(`
        *,
        job_orders (
          id, 
          jo_number,
          customers (id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (baError || !beritaAcara) {
      return new Response(JSON.stringify({ error: 'Berita Acara not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch company settings
    const company = await getCompanySettingsForPDF()

    // Parse photo_urls if it's a string
    let photoUrls: string[] = []
    if (beritaAcara.photo_urls) {
      if (typeof beritaAcara.photo_urls === 'string') {
        try {
          photoUrls = JSON.parse(beritaAcara.photo_urls)
        } catch {
          photoUrls = []
        }
      } else if (Array.isArray(beritaAcara.photo_urls)) {
        photoUrls = beritaAcara.photo_urls as string[]
      }
    }

    // Prepare data for PDF
    const pdfProps: BeritaAcaraPDFProps = {
      beritaAcara: {
        ba_number: beritaAcara.ba_number,
        handover_date: beritaAcara.handover_date,
        location: beritaAcara.location ?? undefined,
        work_description: beritaAcara.work_description ?? undefined,
        cargo_condition: beritaAcara.cargo_condition ?? undefined,
        condition_notes: beritaAcara.condition_notes ?? undefined,
        company_representative: beritaAcara.company_representative ?? undefined,
        client_representative: beritaAcara.client_representative ?? undefined,
        photo_urls: photoUrls,
        notes: beritaAcara.notes ?? undefined,
      },
      jobOrder: {
        jo_number: beritaAcara.job_orders?.jo_number || '-',
      },
      customer: {
        name: beritaAcara.job_orders?.customers?.name || 'Unknown Customer',
      },
      company,
    }

    // Generate PDF
    const buffer = await renderToBuffer(<BeritaAcaraPDF {...pdfProps} />)

    // Set headers
    const filename = `${beritaAcara.ba_number}.pdf`
    const disposition = download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    return new Response(buffer as BodyInit, {
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
