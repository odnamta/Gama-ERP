'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IntegrationConnection, SyncMapping } from '@/types/integration'
import { getConnection } from '@/lib/integration-actions'
import { getSyncMapping } from '@/lib/sync-mapping-actions'
import { SyncMappingForm } from '@/components/integrations/sync-mapping-form'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function EditMappingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const connectionId = params.id as string
  const mappingId = params.mappingId as string

  const [connection, setConnection] = useState<IntegrationConnection | null>(null)
  const [mapping, setMapping] = useState<SyncMapping | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Load connection
      const connResult = await getConnection(connectionId)
      if (!connResult.success || !connResult.data) {
        toast({
          title: 'Error',
          description: connResult.error || 'Connection not found',
          variant: 'destructive',
        })
        router.push('/settings/integrations')
        return
      }
      setConnection(connResult.data)

      // Load mapping
      const mappingResult = await getSyncMapping(mappingId)
      if (!mappingResult.success || !mappingResult.data) {
        toast({
          title: 'Error',
          description: mappingResult.error || 'Mapping not found',
          variant: 'destructive',
        })
        router.push(`/settings/integrations/${connectionId}/mappings`)
        return
      }
      setMapping(mappingResult.data)
      setIsLoading(false)
    }

    loadData()
  }, [connectionId, mappingId, router, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!mapping) {
    return null
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Sync Mapping</h1>
        <p className="text-muted-foreground mt-1">
          Update mapping for {connection?.connection_name}
        </p>
      </div>

      <SyncMappingForm connectionId={connectionId} mapping={mapping} mode="edit" />
    </div>
  )
}
