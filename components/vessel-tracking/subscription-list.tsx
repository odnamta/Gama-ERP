'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrackingSubscription,
  TrackingType,
  TRACKING_TYPE_LABELS,
} from '@/types/agency';
import {
  Bell,
  BellOff,
  Ship,
  Package,
  FileText,
  MoreVertical,
  Trash2,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SubscriptionListProps {
  subscriptions: TrackingSubscription[];
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (subscription: TrackingSubscription) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * List of user's active tracking subscriptions.
 * Allows toggling active/inactive status and deletion.
 * 
 * **Requirements: 6.4, 6.5**
 */
export function SubscriptionList({
  subscriptions,
  onToggleActive,
  onDelete,
  onEdit,
  isLoading = false,
  className,
}: SubscriptionListProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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

  // Handle toggle active status
  const handleToggleActive = async (subscription: TrackingSubscription) => {
    setError(null);
    setLoadingIds((prev) => new Set(prev).add(subscription.id));

    try {
      await onToggleActive(subscription.id, !subscription.isActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(subscription.id);
        return next;
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setError(null);
    setLoadingIds((prev) => new Set(prev).add(id));

    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Get notification summary
  const getNotificationSummary = (subscription: TrackingSubscription): string[] => {
    const notifications: string[] = [];
    if (subscription.notifyDeparture) notifications.push('Departure');
    if (subscription.notifyArrival) notifications.push('Arrival');
    if (subscription.notifyDelay) notifications.push('Delay');
    if (subscription.notifyMilestone) notifications.push('Milestone');
    return notifications;
  };

  if (subscriptions.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Subscriptions</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            You haven&apos;t subscribed to any tracking updates yet. 
            Search for a shipment and subscribe to receive notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Cards */}
      {subscriptions.map((subscription) => {
        const isItemLoading = loadingIds.has(subscription.id) || isLoading;
        const notifications = getNotificationSummary(subscription);

        return (
          <Card
            key={subscription.id}
            className={cn(
              'transition-opacity',
              !subscription.isActive && 'opacity-60'
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Subscription Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      subscription.isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {getTypeIcon(subscription.trackingType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {TRACKING_TYPE_LABELS[subscription.trackingType]}
                      </Badge>
                      {!subscription.isActive && (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>

                    <p className="font-mono text-sm font-medium mt-1 truncate">
                      {subscription.referenceNumber || subscription.referenceId}
                    </p>

                    {/* Notification Types */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {notifications.map((notif) => (
                        <Badge
                          key={notif}
                          variant="secondary"
                          className="text-xs"
                        >
                          {notif}
                        </Badge>
                      ))}
                    </div>

                    {/* Email if set */}
                    {subscription.email && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Email: {subscription.email}
                      </p>
                    )}

                    {/* Created date */}
                    <p className="text-xs text-muted-foreground mt-1">
                      Subscribed: {format(new Date(subscription.createdAt), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subscription.isActive}
                      onCheckedChange={() => handleToggleActive(subscription)}
                      disabled={isItemLoading}
                      aria-label={subscription.isActive ? 'Pause subscription' : 'Resume subscription'}
                    />
                    {isItemLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* More Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isItemLoading}>
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(subscription)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Preferences
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this subscription? 
                              You will no longer receive notifications for{' '}
                              <span className="font-medium">
                                {subscription.referenceNumber || subscription.referenceId}
                              </span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(subscription.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Compact subscription list for sidebar or widget use
 */
interface CompactSubscriptionListProps {
  subscriptions: TrackingSubscription[];
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  maxItems?: number;
  className?: string;
}

export function CompactSubscriptionList({
  subscriptions,
  onToggleActive,
  maxItems = 5,
  className,
}: CompactSubscriptionListProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const displayedSubscriptions = subscriptions.slice(0, maxItems);
  const remainingCount = subscriptions.length - maxItems;

  const handleToggle = async (subscription: TrackingSubscription) => {
    setLoadingIds((prev) => new Set(prev).add(subscription.id));
    try {
      await onToggleActive(subscription.id, !subscription.isActive);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(subscription.id);
        return next;
      });
    }
  };

  const getTypeIcon = (type: TrackingType) => {
    switch (type) {
      case 'vessel':
        return <Ship className="h-3 w-3" />;
      case 'container':
        return <Package className="h-3 w-3" />;
      case 'booking':
        return <FileText className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className={cn('text-center py-4 text-sm text-muted-foreground', className)}>
        No active subscriptions
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayedSubscriptions.map((subscription) => {
        const isLoading = loadingIds.has(subscription.id);

        return (
          <div
            key={subscription.id}
            className={cn(
              'flex items-center justify-between gap-2 p-2 rounded-lg border',
              !subscription.isActive && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-muted-foreground">
                {getTypeIcon(subscription.trackingType)}
              </div>
              <span className="text-sm font-mono truncate">
                {subscription.referenceNumber || subscription.referenceId.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {subscription.isActive ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <BellOff className="h-3 w-3 text-muted-foreground" />
              )}
              <Switch
                checked={subscription.isActive}
                onCheckedChange={() => handleToggle(subscription)}
                disabled={isLoading}
                className="scale-75"
              />
            </div>
          </div>
        );
      })}

      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          +{remainingCount} more subscription{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Subscription summary card for dashboard
 */
interface SubscriptionSummaryProps {
  subscriptions: TrackingSubscription[];
  className?: string;
}

export function SubscriptionSummary({ subscriptions, className }: SubscriptionSummaryProps) {
  const activeCount = subscriptions.filter((s) => s.isActive).length;
  const pausedCount = subscriptions.filter((s) => !s.isActive).length;

  const byType = {
    vessel: subscriptions.filter((s) => s.trackingType === 'vessel').length,
    container: subscriptions.filter((s) => s.trackingType === 'container').length,
    booking: subscriptions.filter((s) => s.trackingType === 'booking').length,
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Tracking Subscriptions
        </CardTitle>
        <CardDescription>
          {subscriptions.length} total subscription{subscriptions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">{pausedCount}</p>
            <p className="text-xs text-muted-foreground">Paused</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">By Type</p>
          <div className="flex gap-2">
            {byType.vessel > 0 && (
              <Badge variant="outline" className="gap-1">
                <Ship className="h-3 w-3" />
                {byType.vessel}
              </Badge>
            )}
            {byType.container > 0 && (
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {byType.container}
              </Badge>
            )}
            {byType.booking > 0 && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {byType.booking}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
