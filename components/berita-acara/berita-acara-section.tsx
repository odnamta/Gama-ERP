'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BeritaAcaraList } from './berita-acara-list'
import { getBeritaAcaraList } from '@/app/(main)/job-orders/berita-acara-actions'
import { BeritaAcaraWithRelations } from '@/types'
import { ClipboardCheck, Plus, Loader2 } from 'lucide-react'

interface BeritaAcaraSectionProps {
  joId: string
  requiresBeritaAcara?: boolean
}

export function BeritaAcaraSection({ joId, requiresBeritaAcara = false }: BeritaAcaraSectionProps) {
  const [items, setItems] = useState<BeritaAcaraWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true)
      try {
        const data = await getBeritaAcaraList(joId)
        setItems(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadItems()
  }, [joId])

  // Only show section if BA is required or there are existing BAs
  if (!requiresBeritaAcara && items.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Berita Acara
          {requiresBeritaAcara && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
              Required
            </span>
          )}
        </CardTitle>
        <Button asChild>
          <Link href={`/job-orders/${joId}/berita-acara/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Create Berita Acara
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <BeritaAcaraList items={items} joId={joId} />
        )}
      </CardContent>
    </Card>
  )
}
