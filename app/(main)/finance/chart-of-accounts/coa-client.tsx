'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createChartOfAccount, updateChartOfAccount } from '@/lib/gl-actions'
import type { ChartOfAccount, AccountType } from '@/types/accounting'
import { ACCOUNT_TYPE_LABELS } from '@/types/accounting'

const TYPE_COLORS: Record<AccountType, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
}

interface Props {
  accounts: ChartOfAccount[]
  canWrite: boolean
}

export function ChartOfAccountsClient({ accounts, canWrite }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ChartOfAccount | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('asset')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [level, setLevel] = useState(1)

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      !search ||
      a.account_code.toLowerCase().includes(search.toLowerCase()) ||
      a.account_name.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || a.account_type === filterType
    return matchesSearch && matchesType
  })

  function openCreate() {
    setEditing(null)
    setCode('')
    setName('')
    setType('asset')
    setDescription('')
    setParentId('')
    setLevel(1)
    setDialogOpen(true)
  }

  function openEdit(account: ChartOfAccount) {
    setEditing(account)
    setCode(account.account_code)
    setName(account.account_name)
    setType(account.account_type)
    setDescription(account.description || '')
    setParentId(account.parent_id || '')
    setLevel(account.level)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!code.trim() || !name.trim()) {
      toast({ title: 'Kode dan nama akun wajib diisi', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      if (editing) {
        const result = await updateChartOfAccount(editing.id, {
          account_code: code.trim(),
          account_name: name.trim(),
          account_type: type,
          description: description.trim() || null,
          parent_id: parentId || null,
          level,
        })
        if (result.error) {
          toast({ title: result.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Akun berhasil diperbarui' })
      } else {
        const result = await createChartOfAccount({
          account_code: code.trim(),
          account_name: name.trim(),
          account_type: type,
          description: description.trim() || null,
          parent_id: parentId || null,
          level,
        })
        if (result.error) {
          toast({ title: result.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Akun berhasil dibuat' })
      }
      setDialogOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Group by type for summary
  const typeCounts = accounts.reduce(
    (acc, a) => {
      acc[a.account_type] = (acc[a.account_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(filterType === t ? 'all' : t)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              filterType === t ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
          >
            <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[t]}</p>
            <p className="text-2xl font-bold">{typeCounts[t] || 0}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama akun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Akun
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Kode</TableHead>
              <TableHead>Nama Akun</TableHead>
              <TableHead className="w-[120px]">Tipe</TableHead>
              <TableHead className="w-[60px]">Level</TableHead>
              <TableHead>Deskripsi</TableHead>
              {canWrite && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 6 : 5} className="text-center text-muted-foreground py-8">
                  {accounts.length === 0
                    ? 'Belum ada akun. Klik "Tambah Akun" untuk memulai.'
                    : 'Tidak ada akun yang cocok dengan pencarian.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono font-medium">{account.account_code}</TableCell>
                  <TableCell
                    style={{ paddingLeft: `${(account.level - 1) * 24 + 16}px` }}
                    className="font-medium"
                  >
                    {account.account_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={TYPE_COLORS[account.account_type]}>
                      {ACCOUNT_TYPE_LABELS[account.account_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{account.level}</TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                    {account.description || '—'}
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Akun *</Label>
                <Input
                  id="code"
                  placeholder="1-1000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Akun *</Label>
                <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Akun *</Label>
              <Input
                id="name"
                placeholder="Kas & Bank"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent">Akun Induk</Label>
                <Select value={parentId || '__none__'} onValueChange={(v) => setParentId(v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tidak ada (root)</SelectItem>
                    {accounts
                      .filter((a) => a.id !== editing?.id)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.account_code} — {a.account_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  max={5}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea
                id="desc"
                placeholder="Deskripsi opsional..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Akun'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
