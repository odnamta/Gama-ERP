'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { NotificationTypeWithPreference } from '@/types/user-preferences'
import { cn } from '@/lib/utils'

interface NotificationTypeRowProps {
  type: NotificationTypeWithPreference
  emailDisabled: boolean
  inAppDisabled: boolean
  onEmailChange: (enabled: boolean) => void
  onInAppChange: (enabled: boolean) => void
}

export function NotificationTypeRow({
  type,
  emailDisabled,
  inAppDisabled,
  onEmailChange,
  onInAppChange,
}: NotificationTypeRowProps) {
  return (
    <div className="grid grid-cols-[1fr,80px,80px] gap-2 p-3 border-b last:border-b-0 items-center">
      <div>
        <p className="font-medium text-sm">{type.type_name}</p>
        {type.description && (
          <p className="text-xs text-muted-foreground">{type.description}</p>
        )}
      </div>
      <div className="flex justify-center">
        <div className={cn('relative', emailDisabled && 'opacity-50')}>
          <Checkbox
            checked={type.email_enabled}
            onCheckedChange={(checked) => onEmailChange(checked === true)}
            disabled={emailDisabled}
            aria-label={`Email notifications for ${type.type_name}`}
          />
          {emailDisabled && (
            <span className="sr-only">
              Email notifications are disabled globally
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        <div className={cn('relative', inAppDisabled && 'opacity-50')}>
          <Checkbox
            checked={type.in_app_enabled}
            onCheckedChange={(checked) => onInAppChange(checked === true)}
            disabled={inAppDisabled}
            aria-label={`In-app notifications for ${type.type_name}`}
          />
          {inAppDisabled && (
            <span className="sr-only">
              In-app notifications are disabled globally
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
