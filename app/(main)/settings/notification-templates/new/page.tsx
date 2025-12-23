'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  NotificationTemplateInsert,
  EventType,
  PlaceholderDefinition,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from '@/types/notification-workflows'
import { createNotificationTemplate } from '@/app/actions/notification-template-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ArrowLeft,
  Save,
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Plus,
  Trash2,
} from 'lucide-react'

export default function NewNotificationTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<NotificationTemplateInsert>({
    template_code: '',
    template_name: '',
    event_type: 'job_order.assigned',
    email_subject: null,
    email_body_html: null,
    email_body_text: null,
    whatsapp_template_id: null,
    whatsapp_body: null,
    in_app_title: null,
    in_app_body: null,
    in_app_action_url: null,
    push_title: null,
    push_body: null,
    is_active: true,
  })
  const [placeholders, setPlaceholders] = useState<PlaceholderDefinition[]>([])

  const handleSave = async () => {
    // Validation
    if (!formData.template_code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template code is required',
        variant: 'destructive',
      })
      return
    }
    if (!formData.template_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    const { data, error } = await createNotificationTemplate({
      ...formData,
      placeholders,
    })
    setIsSaving(false)

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else if (data) {
      toast({
        title: 'Success',
        description: 'Template created successfully',
      })
      router.push(`/settings/notification-templates/${data.id}`)
    }
  }

  const addPlaceholder = () => {
    setPlaceholders([
      ...placeholders,
      { key: '', description: '', default_value: '' },
    ])
  }

  const updatePlaceholder = (
    index: number,
    field: keyof PlaceholderDefinition,
    value: string
  ) => {
    const updated = [...placeholders]
    updated[index] = { ...updated[index], [field]: value }
    setPlaceholders(updated)
  }

  const removePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index))
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings/notification-templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Template</h1>
            <p className="text-muted-foreground">
              Create a new notification template
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Template
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_code">Template Code</Label>
              <Input
                id="template_code"
                value={formData.template_code}
                onChange={(e) =>
                  setFormData({ ...formData, template_code: e.target.value.toUpperCase() })
                }
                placeholder="MY_TEMPLATE_CODE"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Uppercase letters, numbers, and underscores only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) =>
                  setFormData({ ...formData, template_name: e.target.value })
                }
                placeholder="My Template Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, event_type: value as EventType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Channel Content</CardTitle>
          <CardDescription>
            Configure notification content for each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="in_app" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App
              </TabsTrigger>
              <TabsTrigger value="push" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email_subject">Subject</Label>
                <Input
                  id="email_subject"
                  value={formData.email_subject || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email_subject: e.target.value || null })
                  }
                  placeholder="Email subject line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_body_html">HTML Body</Label>
                <Textarea
                  id="email_body_html"
                  value={formData.email_body_html || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email_body_html: e.target.value || null })
                  }
                  placeholder="HTML email content"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_body_text">Plain Text Body (fallback)</Label>
                <Textarea
                  id="email_body_text"
                  value={formData.email_body_text || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email_body_text: e.target.value || null })
                  }
                  placeholder="Plain text fallback"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_template_id">Template ID (Meta)</Label>
                <Input
                  id="whatsapp_template_id"
                  value={formData.whatsapp_template_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_template_id: e.target.value || null })
                  }
                  placeholder="Meta WhatsApp template ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_body">Message Body</Label>
                <Textarea
                  id="whatsapp_body"
                  value={formData.whatsapp_body || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_body: e.target.value || null })
                  }
                  placeholder="WhatsApp message content"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="in_app" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="in_app_title">Title</Label>
                <Input
                  id="in_app_title"
                  value={formData.in_app_title || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, in_app_title: e.target.value || null })
                  }
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="in_app_body">Body</Label>
                <Textarea
                  id="in_app_body"
                  value={formData.in_app_body || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, in_app_body: e.target.value || null })
                  }
                  placeholder="Notification body"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="in_app_action_url">Action URL</Label>
                <Input
                  id="in_app_action_url"
                  value={formData.in_app_action_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, in_app_action_url: e.target.value || null })
                  }
                  placeholder="/path/to/action"
                />
              </div>
            </TabsContent>

            <TabsContent value="push" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="push_title">Title</Label>
                <Input
                  id="push_title"
                  value={formData.push_title || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, push_title: e.target.value || null })
                  }
                  placeholder="Push notification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="push_body">Body</Label>
                <Textarea
                  id="push_body"
                  value={formData.push_body || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, push_body: e.target.value || null })
                  }
                  placeholder="Push notification body"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Placeholders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Placeholders</CardTitle>
              <CardDescription>
                Define variables that can be replaced with dynamic data
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addPlaceholder}>
              <Plus className="h-4 w-4 mr-2" />
              Add Placeholder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {placeholders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No placeholders defined. Click &quot;Add Placeholder&quot; to create one.
            </p>
          ) : (
            <div className="space-y-4">
              {placeholders.map((placeholder, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr,2fr,1fr,auto] gap-3 items-start p-3 bg-muted rounded-lg"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Key</Label>
                    <Input
                      value={placeholder.key}
                      onChange={(e) =>
                        updatePlaceholder(index, 'key', e.target.value)
                      }
                      placeholder="variable_name"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={placeholder.description}
                      onChange={(e) =>
                        updatePlaceholder(index, 'description', e.target.value)
                      }
                      placeholder="What this placeholder represents"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Default Value</Label>
                    <Input
                      value={placeholder.default_value || ''}
                      onChange={(e) =>
                        updatePlaceholder(index, 'default_value', e.target.value)
                      }
                      placeholder="Optional default"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removePlaceholder(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
