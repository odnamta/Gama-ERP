'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { createJournalEntry } from '@/lib/gl-actions'
import { formatCurrency } from '@/lib/utils/format'
import type { ChartOfAccount, JournalEntrySourceType } from '@/types/accounting'
import { JOURNAL_ENTRY_SOURCE_LABELS, ACCOUNT_TYPE_LABELS } from '@/types/accounting'

interface LineItem {
  account_id: string
  debit: number
  credit: number
  description: string
}

interface Props {
  accounts: ChartOfAccount[]
}

export function NewJournalEntryForm({ accounts }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Header fields
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState<JournalEntrySourceType>('manual')
  const [notes, setNotes] = useState('')

  // Lines
  const [lines, setLines] = useState<LineItem[]>([
    { account_id: '', debit: 0, credit: 0, description: '' },
    { account_id: '', debit: 0, credit: 0, description: '' },
  ])

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01
  const hasEmptyAccounts = lines.some((l) => !l.account_id)

  function addLine() {
    setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }])
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return
    setLines(lines.filter((_, i) => i !== index))
  }

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...lines]
    updated[index] = { ...updated[index], [field]: value }
    setLines(updated)
  }

  async function handleSubmit() {
    if (!description.trim()) {
      toast({ title: 'Deskripsi wajib diisi', variant: 'destructive' })
      return
    }
    if (hasEmptyAccounts) {
      toast({ title: 'Semua baris harus memiliki akun', variant: 'destructive' })
      return
    }
    if (!isBalanced) {
      toast({
        title: `Debit (${formatCurrency(totalDebit)}) harus sama dengan Kredit (${formatCurrency(totalCredit)})`,
        variant: 'destructive',
      })
      return
    }
    if (totalDebit === 0) {
      toast({ title: 'Jurnal harus memiliki nilai lebih dari 0', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const result = await createJournalEntry({
        entry_date: entryDate,
        description: description.trim(),
        source_type: sourceType,
        notes: notes.trim() || null,
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit: l.debit || 0,
          credit: l.credit || 0,
          description: l.description.trim() || null,
        })),
      })

      if (result.error) {
        toast({ title: result.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Jurnal berhasil dibuat' })
      router.push(`/finance/journal-entries/${result.id}`)
    } finally {
      setLoading(false)
    }
  }

  // Group accounts by type for better selection
  const accountsByType = accounts.reduce(
    (acc, a) => {
      if (!acc[a.account_type]) acc[a.account_type] = []
      acc[a.account_type].push(a)
      return acc
    },
    {} as Record<string, ChartOfAccount[]>
  )

  return (
    <>
      <Link href="/finance/journal-entries">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </Link>

      {/* Header fields */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Jurnal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sumber</Label>
              <Select value={sourceType} onValueChange={(v) => setSourceType(v as JournalEntrySourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(JOURNAL_ENTRY_SOURCE_LABELS) as JournalEntrySourceType[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {JOURNAL_ENTRY_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Deskripsi *</Label>
            <Input
              placeholder="Deskripsi jurnal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              placeholder="Catatan tambahan (opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Baris Jurnal</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Baris
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="min-w-[200px]">Akun</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right w-[150px]">Debit</TableHead>
                <TableHead className="text-right w-[150px]">Kredit</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Select
                      value={line.account_id || '__none__'}
                      onValueChange={(v) => updateLine(i, 'account_id', v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih akun..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" disabled>Pilih akun...</SelectItem>
                        {Object.entries(accountsByType).map(([type, accts]) => (
                          <div key={type}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS] || type}
                            </div>
                            {accts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.account_code} — {a.account_name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Keterangan baris..."
                      value={line.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={line.debit || ''}
                      onChange={(e) => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                      className="h-9 text-right font-mono"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={line.credit || ''}
                      onChange={(e) => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                      className="h-9 text-right font-mono"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(i)}
                      disabled={lines.length <= 2}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(totalDebit)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(totalCredit)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Balance indicator */}
      {totalDebit > 0 || totalCredit > 0 ? (
        <div
          className={`rounded-lg border p-3 text-sm ${
            isBalanced
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {isBalanced
            ? `Jurnal balance — Debit = Kredit = ${formatCurrency(totalDebit)}`
            : `Jurnal tidak balance — Selisih: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
        </div>
      ) : null}

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Link href="/finance/journal-entries">
          <Button variant="outline">Batal</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading || !isBalanced || hasEmptyAccounts || !description.trim() || totalDebit === 0}
        >
          {loading ? 'Menyimpan...' : 'Buat Jurnal'}
        </Button>
      </div>
    </>
  )
}
