'use client';

/**
 * WidgetDashboard Component
 * v0.34: Dashboard Widgets & Customization
 * 
 * Main dashboard component that loads user widgets and renders the grid.
 * Supports customization mode for editing layout.
 */

import { useState, useEffect, useCallback } from 'react';
import { WidgetGrid } from './WidgetGrid';
import { WidgetCustomizer } from './WidgetCustomizer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings2, RefreshCw, RotateCcw } from 'lucide-react';
import { getUserWidgets, saveWidgetLayout, resetWidgetLayout } from '@/lib/widget-utils';
import { useToast } from '@/hooks/use-toast';
import type { WidgetConfig } from '@/types/widgets';

interface WidgetDashboardProps {
  userId: string;
  userRole: string;
  title?: string;
}

export function WidgetDashboard({ userId, userRole, title = 'Dashboard' }: WidgetDashboardProps) {
  const [configs, setConfigs] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load user widgets
  const loadWidgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const widgets = await getUserWidgets(userId, userRole);
      setConfigs(widgets);
    } catch (error) {
      console.error('Failed to load widgets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard widgets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole, toast]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  // Handle layout changes
  const handleLayoutChange = useCallback((newConfigs: WidgetConfig[]) => {
    setConfigs(newConfigs);
  }, []);

  // Save layout
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWidgetLayout(userId, configs);
      setIsEditing(false);
      toast({
        title: 'Saved',
        description: 'Dashboard layout saved successfully',
      });
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dashboard layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset layout
  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetWidgetLayout(userId);
      await loadWidgets();
      setIsEditing(false);
      toast({
        title: 'Reset',
        description: 'Dashboard layout reset to defaults',
      });
    } catch (error) {
      console.error('Failed to reset layout:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset dashboard layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    loadWidgets(); // Reload original configs
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Layout'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={loadWidgets}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Customize
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Customizer panel (when editing) */}
      {isEditing && (
        <WidgetCustomizer
          configs={configs}
          userRole={userRole}
          userId={userId}
          onConfigsChange={handleLayoutChange}
        />
      )}

      {/* Widget grid */}
      <WidgetGrid
        configs={configs}
        onLayoutChange={handleLayoutChange}
        isEditing={isEditing}
      />
    </div>
  );
}

export default WidgetDashboard;
