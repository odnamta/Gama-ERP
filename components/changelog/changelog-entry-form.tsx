'use client';

/**
 * Changelog Entry Form Component
 * Task 7.2: Create changelog entry form component
 * Requirement 7.2: Form with Version, Title, Description, Category, Is Major
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createChangelogEntry, updateChangelogEntry } from '@/app/(main)/admin/changelog/actions';
import type { ChangelogEntry, ChangelogCategory, ChangelogEntryInput } from '@/types/changelog';
import { VALID_CATEGORIES } from '@/types/changelog';
import { formatCategoryLabel } from '@/lib/changelog-utils';

interface ChangelogEntryFormProps {
  entry?: ChangelogEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangelogEntryForm({ entry, onSuccess, onCancel }: ChangelogEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ChangelogEntryInput>({
    version: entry?.version || '',
    title: entry?.title || '',
    description: entry?.description || '',
    category: entry?.category || 'feature',
    is_major: entry?.is_major || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = entry
        ? await updateChangelogEntry(entry.id, formData)
        : await createChangelogEntry(formData);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: entry ? 'Entry updated successfully' : 'Entry created successfully',
        });
        
        if (!entry) {
          // Reset form for new entries
          setFormData({
            version: '',
            title: '',
            description: '',
            category: 'feature',
            is_major: false,
          });
        }
        
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save entry',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry ? 'Edit Entry' : 'Add New Entry'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g., v0.37"
                value={formData.version || ''}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ChangelogCategory) => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALID_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {formatCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., New Dashboard Features"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the changes..."
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_major"
              checked={formData.is_major}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_major: checked === true })
              }
            />
            <Label htmlFor="is_major" className="cursor-pointer">
              Major Update (will be highlighted)
            </Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : entry ? 'Update' : 'Create'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
