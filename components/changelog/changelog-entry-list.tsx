'use client';

/**
 * Changelog Entry List Component
 * Task 7.3: Create changelog entry list component
 * Requirement 7.4: Display existing entries with edit and delete options
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { CategoryBadge } from './category-badge';
import { ChangelogEntryForm } from './changelog-entry-form';
import { deleteChangelogEntry } from '@/app/(main)/admin/changelog/actions';
import { formatPublishedDate } from '@/lib/changelog-utils';
import type { ChangelogEntry } from '@/types/changelog';
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChangelogEntryListProps {
  entries: ChangelogEntry[];
}

export function ChangelogEntryList({ entries }: ChangelogEntryListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    try {
      const result = await deleteChangelogEntry(id);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Entry deleted successfully',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete entry',
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
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingId(null);
    router.refresh();
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No changelog entries yet. Create your first entry above.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Entries ({entries.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id}>
            {editingId === entry.id ? (
              <ChangelogEntryForm
                entry={entry}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className={`border rounded-lg p-4 ${entry.is_major ? 'border-primary' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {entry.is_major && (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      {entry.version && (
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {entry.version}
                        </span>
                      )}
                      <CategoryBadge category={entry.category} />
                      <span className="text-sm text-muted-foreground">
                        {formatPublishedDate(entry.published_at)}
                      </span>
                    </div>
                    <h3 className="font-semibold">{entry.title}</h3>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(entry.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{entry.title}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
