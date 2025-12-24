'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IntegrationConnection } from '@/types/integration'
import { getConnection } from '@/lib/integration-actions'
import { ConnectionForm } from '@/components/integrations/connection-form'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function EditConnectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const connectionId = params.id as string

  const [connection, setConnection] = useState<IntegrationConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConnection = async () => {
      const result = await getConnection(connectionId)
      if (!result.success || !result.data) {
        toast({
          title: 'Error',
          description: result.error || 'Connection not found',
          variant: 'destructive',
        })
        router.push('/settings/integrations')
        return
      }
      setConnection(result.data)
      setIsLoading(false)
    }

    loadConnection()
  }, [connectionId, router, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!connection) {
    return null
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Connection</h1>
        <p className="text-muted-foreground mt-1">
          Update connection settings for {connection.connection_name}
        </p>
      </div>

      <ConnectionForm connection={connection} mode="edit" />
    </div>
  )
}
