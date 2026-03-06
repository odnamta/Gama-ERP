// =====================================================
// GL Journal Entry Types — Phase 2E-3
// =====================================================

/**
 * Account types in Chart of Accounts
 */
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

/**
 * Journal entry status
 */
export type JournalEntryStatus = 'draft' | 'posted' | 'reversed'

/**
 * Source types for journal entries
 */
export type JournalEntrySourceType = 'invoice' | 'bkk' | 'manual' | 'adjustment'

// =====================================================
// Chart of Accounts
// =====================================================

export interface ChartOfAccount {
  id: string
  account_code: string
  account_name: string
  account_type: AccountType
  parent_id: string | null
  description: string | null
  is_active: boolean
  level: number
  created_at: string
  updated_at: string
}

export interface ChartOfAccountWithChildren extends ChartOfAccount {
  children?: ChartOfAccountWithChildren[]
}

export interface CreateChartOfAccountInput {
  account_code: string
  account_name: string
  account_type: AccountType
  parent_id?: string | null
  description?: string | null
  level?: number
}

// =====================================================
// Journal Entries
// =====================================================

export interface JournalEntry {
  id: string
  entry_number: string
  entry_date: string
  description: string
  source_type: JournalEntrySourceType
  source_id: string | null
  status: JournalEntryStatus
  total_debit: number
  total_credit: number
  created_by: string | null
  posted_by: string | null
  posted_at: string | null
  reversed_by: string | null
  reversed_at: string | null
  reversal_of: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[]
}

export interface CreateJournalEntryInput {
  entry_date: string
  description: string
  source_type: JournalEntrySourceType
  source_id?: string | null
  notes?: string | null
  lines: CreateJournalEntryLineInput[]
}

// =====================================================
// Journal Entry Lines
// =====================================================

export interface JournalEntryLine {
  id: string
  journal_entry_id: string
  account_id: string
  debit: number
  credit: number
  description: string | null
  line_order: number
  created_at: string
  // Joined fields
  account?: Pick<ChartOfAccount, 'account_code' | 'account_name' | 'account_type'>
}

export interface CreateJournalEntryLineInput {
  account_id: string
  debit: number
  credit: number
  description?: string | null
}

// =====================================================
// Account Type Labels (Indonesian)
// =====================================================

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Aset',
  liability: 'Kewajiban',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

export const JOURNAL_ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  reversed: 'Dibalik',
}

export const JOURNAL_ENTRY_SOURCE_LABELS: Record<JournalEntrySourceType, string> = {
  invoice: 'Invoice',
  bkk: 'BKK',
  manual: 'Manual',
  adjustment: 'Penyesuaian',
}
