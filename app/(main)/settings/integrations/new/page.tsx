'use client'

import { ConnectionForm } from '@/components/integrations/connection-form'

export default function NewConnectionPage() {
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Integration Connection</h1>
        <p className="text-muted-foreground mt-1">
          Configure a new connection to an external system
        </p>
      </div>

      <ConnectionForm mode="create" />
    </div>
  )
}
