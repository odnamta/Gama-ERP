'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuratJalanList } from './surat-jalan-list'
import { getSuratJalanList } from '@/app/(main)/job-orders/surat-jalan-actions'
import { SuratJalanWithRelations } from '@/types'
import { FileText, Plus, Loader2 } from 'lucide-react'

interface SuratJalanSectionProps {
  joId: string
}

export function SuratJalanSection({ joId }: SuratJalanSectionProps) {
  const [items, setItems] = useState<SuratJalanWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true)
      try {
        const data = await getSuratJalanList(joId)
        setItems(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadItems()
  }, [joId])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Surat Jalan
        </CardTitle>
        <Button asChild>
          <Link href={`/job-orders/${joId}/surat-jalan/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Create Surat Jalan
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
          <SuratJalanList items={items} joId={joId} />
        )}
      </CardContent>
    </Card>
  )
}
