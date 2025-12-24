'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  IntegrationConnection,
  IntegrationType,
  Provider,
  CreateConnectionInput,
  UpdateConnectionInput,
  VALID_INTEGRATION_TYPES,
  VALID_PROVIDERS,
  EncryptedCredentials,
  ConnectionConfig,
} from '@/types/integration'
import {
  createConnection,
  updateConnection,
  testConnection,
} from '@/lib/integration-actions'
import {
  formatIntegrationType,
  formatProvider,
  generateConnectionCode,
} from '@/lib/integration-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'

interface ConnectionFormProps {
  connection?: IntegrationConnection
  mode: 'create' | 'edit'
}

// Provider-specific credential fields
const PROVIDER_CREDENTIAL_FIELDS: Record<Provider, { key: string; label: string; type: 'text' | 'password' }[]> = {
  accurate: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'api_secret', label: 'API Secret', type: 'password' },
  ],
  jurnal: [
    { key: 'api_key', label: 'API Key', type: 'password' },
  ],
  xero: [
    { key: 'client_id', label: 'Client ID', type: 'text' },
    { key: 'client_secret', label: 'Client Secret', type: 'password' },
  ],
  google_sheets: [
    { key: 'client_id', label: 'Client ID', type: 'text' },
    { key: 'client_secret', label: 'Client Secret', type: 'password' },
  ],
  whatsapp: [
    { key: 'api_key', label: 'API Key', type: 'password' },
    { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
  ],
  telegram: [
    { key: 'bot_token', label: 'Bot Token', type: 'password' },
  ],
  slack: [
    { key: 'bot_token', label: 'Bot Token', type: 'password' },
    { key: 'signing_secret', label: 'Signing Secret', type: 'password' },
  ],
  google_drive: [
    { key: 'client_id', label: 'Client ID', type: 'text' },
    { key: 'client_secret', label: 'Client Secret', type: 'password' },
  ],
  dropbox: [
    { key: 'app_key', label: 'App Key', type: 'text' },
    { key: 'app_secret', label: 'App Secret', type: 'password' },
  ],
}


// Provider-specific config fields
const PROVIDER_CONFIG_FIELDS: Record<Provider, { key: string; label: string; type: 'text' | 'number' | 'boolean' }[]> = {
  accurate: [
    { key: 'base_url', label: 'API Base URL', type: 'text' },
    { key: 'sync_invoices', label: 'Sync Invoices', type: 'boolean' },
    { key: 'sync_payments', label: 'Sync Payments', type: 'boolean' },
    { key: 'sync_customers', label: 'Sync Customers', type: 'boolean' },
  ],
  jurnal: [
    { key: 'base_url', label: 'API Base URL', type: 'text' },
    { key: 'sync_invoices', label: 'Sync Invoices', type: 'boolean' },
    { key: 'sync_payments', label: 'Sync Payments', type: 'boolean' },
  ],
  xero: [
    { key: 'sync_invoices', label: 'Sync Invoices', type: 'boolean' },
    { key: 'sync_payments', label: 'Sync Payments', type: 'boolean' },
    { key: 'sync_customers', label: 'Sync Customers', type: 'boolean' },
  ],
  google_sheets: [
    { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text' },
  ],
  whatsapp: [
    { key: 'base_url', label: 'API Base URL', type: 'text' },
  ],
  telegram: [
    { key: 'chat_id', label: 'Default Chat ID', type: 'text' },
  ],
  slack: [
    { key: 'default_channel', label: 'Default Channel', type: 'text' },
  ],
  google_drive: [
    { key: 'folder_id', label: 'Root Folder ID', type: 'text' },
    { key: 'auto_backup', label: 'Auto Backup', type: 'boolean' },
  ],
  dropbox: [
    { key: 'folder_path', label: 'Root Folder Path', type: 'text' },
    { key: 'auto_backup', label: 'Auto Backup', type: 'boolean' },
  ],
}

export function ConnectionForm({ connection, mode }: ConnectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})

  // Form state
  const [connectionCode, setConnectionCode] = useState(connection?.connection_code || '')
  const [connectionName, setConnectionName] = useState(connection?.connection_name || '')
  const [integrationType, setIntegrationType] = useState<IntegrationType>(connection?.integration_type || 'accounting')
  const [provider, setProvider] = useState<Provider>(connection?.provider || 'accurate')
  const [isActive, setIsActive] = useState(connection?.is_active ?? true)
  const [credentials, setCredentials] = useState<EncryptedCredentials>(connection?.credentials || {})
  const [config, setConfig] = useState<ConnectionConfig>(connection?.config || {})

  // Generate connection code when provider changes (only in create mode)
  useEffect(() => {
    if (mode === 'create' && provider && !connectionCode) {
      setConnectionCode(generateConnectionCode(provider))
    }
  }, [mode, provider, connectionCode])

  // Filter providers by integration type
  const getProvidersForType = (type: IntegrationType): Provider[] => {
    const providerTypeMap: Record<IntegrationType, Provider[]> = {
      accounting: ['accurate', 'jurnal', 'xero'],
      tracking: [], // GPS tracking providers would go here
      email: [],
      storage: ['google_drive', 'dropbox'],
      messaging: ['whatsapp', 'telegram', 'slack'],
      custom: VALID_PROVIDERS,
    }
    return providerTypeMap[type] || []
  }

  const availableProviders = getProvidersForType(integrationType)


  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }))
  }

  const handleConfigChange = (key: string, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const toggleCredentialVisibility = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const input: CreateConnectionInput = {
          connection_code: connectionCode,
          connection_name: connectionName,
          integration_type: integrationType,
          provider,
          credentials: Object.keys(credentials).length > 0 ? credentials : null,
          config,
          is_active: isActive,
        }

        const result = await createConnection(input)
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create connection',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Success',
            description: 'Connection created successfully',
          })
          router.push('/settings/integrations')
        }
      } else {
        const input: UpdateConnectionInput = {
          connection_code: connectionCode,
          connection_name: connectionName,
          integration_type: integrationType,
          provider,
          credentials: Object.keys(credentials).length > 0 ? credentials : null,
          config,
          is_active: isActive,
        }

        const result = await updateConnection(connection!.id, input)
        if (!result.success) {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update connection',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Success',
            description: 'Connection updated successfully',
          })
          router.push('/settings/integrations')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestConnection = async () => {
    if (!connection?.id) {
      toast({
        title: 'Info',
        description: 'Save the connection first to test it',
      })
      return
    }

    setIsTesting(true)
    const result = await testConnection(connection.id)
    setIsTesting(false)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to test connection',
        variant: 'destructive',
      })
    } else if (result.data) {
      if (result.data.success) {
        toast({
          title: 'Connection Successful',
          description: `Response time: ${result.data.response_time_ms}ms`,
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.data.message,
          variant: 'destructive',
        })
      }
    }
  }


  const credentialFields = PROVIDER_CREDENTIAL_FIELDS[provider] || []
  const configFields = PROVIDER_CONFIG_FIELDS[provider] || []

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the connection name and type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="connection_code">Connection Code</Label>
              <Input
                id="connection_code"
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value)}
                placeholder="e.g., ACCURATE_001"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this connection
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="connection_name">Connection Name</Label>
              <Input
                id="connection_name"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="e.g., Accurate Online - Production"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="integration_type">Integration Type</Label>
              <Select
                value={integrationType}
                onValueChange={(value) => {
                  setIntegrationType(value as IntegrationType)
                  // Reset provider when type changes
                  const newProviders = getProvidersForType(value as IntegrationType)
                  if (newProviders.length > 0 && !newProviders.includes(provider)) {
                    setProvider(newProviders[0])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_INTEGRATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatIntegrationType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => setProvider(value as Provider)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.length > 0 ? (
                    availableProviders.map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatProvider(p)}
                      </SelectItem>
                    ))
                  ) : (
                    VALID_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatProvider(p)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </CardContent>
      </Card>


      {/* Credentials */}
      {credentialFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>
              API keys and authentication credentials for {formatProvider(provider)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.type === 'password' && !showCredentials[field.key] ? 'password' : 'text'}
                    value={(credentials[field.key] as string) || ''}
                    onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="pr-10"
                  />
                  {field.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleCredentialVisibility(field.key)}
                    >
                      {showCredentials[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {configFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Provider-specific settings for {formatProvider(provider)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configFields.map((field) => (
              <div key={field.key} className="space-y-2">
                {field.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={field.key}
                      checked={Boolean(config[field.key])}
                      onCheckedChange={(checked) => handleConfigChange(field.key, checked)}
                    />
                    <Label htmlFor={field.key}>{field.label}</Label>
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={(config[field.key] as string | number) || ''}
                      onChange={(e) => handleConfigChange(
                        field.key,
                        field.type === 'number' ? Number(e.target.value) : e.target.value
                      )}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/settings/integrations')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Create Connection' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}
