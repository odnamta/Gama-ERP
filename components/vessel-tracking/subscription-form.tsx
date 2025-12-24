'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell, AlertCircle, Ship, Package, FileText } from 'lucide-react';
import {
  SubscriptionFormData,
  TrackingType,
  TRACKING_TYPES,
  TRACKING_TYPE_LABELS,
} from '@/types/agency';
import { cn } from '@/lib/utils';

// Form validation schema
export const subscriptionFormSchema = z.object({
  trackingType: z.enum(['vessel', 'container', 'booking']),
  referenceId: z.string().min(1, 'Reference ID is required'),
  referenceNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  notifyDeparture: z.boolean(),
  notifyArrival: z.boolean(),
  notifyDelay: z.boolean(),
  notifyMilestone: z.boolean(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  initialData?: Partial<SubscriptionFormData> | null;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
  /** Pre-fill tracking type and reference for quick subscription */
  prefilledType?: TrackingType;
  prefilledReferenceId?: string;
  prefilledReferenceNumber?: string;
  /** Hide tracking type and reference fields when prefilled */
  hideReferenceFields?: boolean;
}

/**
 * Form for creating and editing tracking subscriptions.
 * Includes notification preference checkboxes.
 * 
 * **Requirements: 6.1, 6.2, 6.3**
 */
export function SubscriptionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  className,
  prefilledType,
  prefilledReferenceId,
  prefilledReferenceNumber,
  hideReferenceFields = false,
}: SubscriptionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema) as never,
    defaultValues: {
      trackingType: prefilledType || initialData?.trackingType || 'booking',
      referenceId: prefilledReferenceId || initialData?.referenceId || '',
      referenceNumber: prefilledReferenceNumber || initialData?.referenceNumber || '',
      email: initialData?.email || '',
      notifyDeparture: initialData?.notifyDeparture ?? true,
      notifyArrival: initialData?.notifyArrival ?? true,
      notifyDelay: initialData?.notifyDelay ?? true,
      notifyMilestone: initialData?.notifyMilestone ?? true,
    },
  });

  const watchedTrackingType = watch('trackingType');
  const watchedNotifyDeparture = watch('notifyDeparture');
  const watchedNotifyArrival = watch('notifyArrival');
  const watchedNotifyDelay = watch('notifyDelay');
  const watchedNotifyMilestone = watch('notifyMilestone');

  const handleFormSubmit = async (data: SubscriptionFormValues) => {
    setSubmitError(null);

    const formData: SubscriptionFormData = {
      trackingType: data.trackingType,
      referenceId: data.referenceId,
      referenceNumber: data.referenceNumber || undefined,
      email: data.email || undefined,
      notifyDeparture: data.notifyDeparture,
      notifyArrival: data.notifyArrival,
      notifyDelay: data.notifyDelay,
      notifyMilestone: data.notifyMilestone,
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save subscription');
    }
  };

  // Get icon for tracking type
  const getTypeIcon = (type: TrackingType) => {
    switch (type) {
      case 'vessel':
        return <Ship className="h-4 w-4" />;
      case 'container':
        return <Package className="h-4 w-4" />;
      case 'booking':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get placeholder for reference ID based on type
  const getReferencePlaceholder = () => {
    switch (watchedTrackingType) {
      case 'vessel':
        return 'Enter vessel ID';
      case 'container':
        return 'Enter container ID or number';
      case 'booking':
        return 'Enter booking ID';
      default:
        return 'Enter reference ID';
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
      {/* Error Message */}
      {submitError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Selection */}
      {!hideReferenceFields && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(watchedTrackingType)}
              Tracking Reference
            </CardTitle>
            <CardDescription>
              Select what you want to track and provide the reference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trackingType">Tracking Type *</Label>
              <Select
                value={watchedTrackingType}
                onValueChange={(value) => setValue('trackingType', value as TrackingType)}
                disabled={isLoading || !!prefilledType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tracking type" />
                </SelectTrigger>
                <SelectContent>
                  {TRACKING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        {TRACKING_TYPE_LABELS[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trackingType && (
                <p className="text-sm text-destructive">{errors.trackingType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceId">Reference ID *</Label>
              <Input
                id="referenceId"
                {...register('referenceId')}
                placeholder={getReferencePlaceholder()}
                disabled={isLoading || !!prefilledReferenceId}
              />
              {errors.referenceId && (
                <p className="text-sm text-destructive">{errors.referenceId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                {...register('referenceNumber')}
                placeholder="e.g., MSCU1234567, BK-2025-0001"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Human-readable reference for easy identification
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which events you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="notifyDeparture"
                checked={watchedNotifyDeparture}
                onCheckedChange={(checked) => setValue('notifyDeparture', !!checked)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="notifyDeparture" className="cursor-pointer">
                  Departure Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when vessel departs from port
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="notifyArrival"
                checked={watchedNotifyArrival}
                onCheckedChange={(checked) => setValue('notifyArrival', !!checked)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="notifyArrival" className="cursor-pointer">
                  Arrival Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when vessel arrives at port
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="notifyDelay"
                checked={watchedNotifyDelay}
                onCheckedChange={(checked) => setValue('notifyDelay', !!checked)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="notifyDelay" className="cursor-pointer">
                  Delay Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about schedule delays
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="notifyMilestone"
                checked={watchedNotifyMilestone}
                onCheckedChange={(checked) => setValue('notifyMilestone', !!checked)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="notifyMilestone" className="cursor-pointer">
                  Milestone Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about shipment milestones (gate in, loaded, etc.)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications (Optional)</CardTitle>
          <CardDescription>
            Receive notifications via email in addition to in-app notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="your@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to only receive in-app notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Subscribe' : 'Update Subscription'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Compact subscription button for quick subscription from tracking results
 */
interface QuickSubscribeButtonProps {
  trackingType: TrackingType;
  referenceId: string;
  referenceNumber?: string;
  onSubscribe: (data: SubscriptionFormData) => Promise<void>;
  isSubscribed?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function QuickSubscribeButton({
  trackingType,
  referenceId,
  referenceNumber,
  onSubscribe,
  isSubscribed = false,
  isLoading = false,
  className,
}: QuickSubscribeButtonProps) {
  const handleClick = async () => {
    if (isSubscribed) return;

    await onSubscribe({
      trackingType,
      referenceId,
      referenceNumber,
      notifyDeparture: true,
      notifyArrival: true,
      notifyDelay: true,
      notifyMilestone: true,
    });
  };

  return (
    <Button
      variant={isSubscribed ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading || isSubscribed}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className={cn('h-4 w-4', isSubscribed && 'fill-current')} />
      )}
      {isSubscribed ? 'Subscribed' : 'Subscribe'}
    </Button>
  );
}
