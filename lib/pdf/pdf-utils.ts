import { createClient } from '@/lib/supabase/server'

/**
 * Company settings interface for PDF generation
 */
export interface CompanySettingsForPDF {
  company_name: string
  company_legal_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_tax_id?: string
  logo_url?: string
  bank_name?: string
  bank_account?: string
  bank_account_name?: string
}

/**
 * Fetch company settings from database for PDF generation
 */
export async function getCompanySettingsForPDF(): Promise<CompanySettingsForPDF> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('company_settings')
    .select('key, value')
  
  const settings: Record<string, string> = {}
  data?.forEach(row => {
    if (row.value) settings[row.key] = row.value
  })
  
  return {
    company_name: settings.company_name || 'PT. Gama Intisamudera',
    company_legal_name: settings.company_legal_name,
    company_address: settings.company_address,
    company_phone: settings.company_phone,
    company_email: settings.company_email,
    company_tax_id: settings.company_tax_id,
    logo_url: settings.logo_url,
    bank_name: settings.bank_name,
    bank_account: settings.bank_account,
    bank_account_name: settings.bank_account_name,
  }
}

/**
 * Format currency for PDF display in Indonesian Rupiah format
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 1.234.567"
 */
export function formatCurrencyForPDF(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0'
  }
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Format date for PDF display in DD/MM/YYYY format
 * @param dateString - ISO date string or Date object
 * @returns Formatted string like "19/12/2025"
 */
export function formatDateForPDF(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return '-'
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) {
    return '-'
  }
  
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}
