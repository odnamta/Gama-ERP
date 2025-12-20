/**
 * Global Search Component
 * v0.24: Global Search Feature
 * 
 * Command palette-style search accessible via Cmd+K / Ctrl+K
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Search,
  User,
  FolderOpen,
  FileText,
  Receipt,
  Building2,
  Clock,
  Plus,
  Command,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SearchResult,
  EntityType,
  ENTITY_LABELS,
  performSearch,
  getOrderedGroupedResults,
  shouldSearch,
} from '@/lib/search-utils';
import {
  loadRecentSearches,
  saveRecentSearch,
} from '@/lib/recent-searches-utils';

// Entity icons mapping
const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  customer: User,
  project: FolderOpen,
  pjo: FileText,
  jo: FileText,
  invoice: Receipt,
  vendor: Building2,
  quotation: FileSpreadsheet,
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Search function
  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!shouldSearch(searchQuery)) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await performSearch(searchQuery, 20);
      setResults(data);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  // Navigate to result
  const navigateToResult = useCallback((result: SearchResult) => {
    // Save to recent searches
    const updated = saveRecentSearch(query);
    setRecentSearches(updated);

    // Navigate
    router.push(result.url);
    setOpen(false);
    setQuery('');
    setResults([]);
  }, [query, router]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  };

  // Get grouped results for display
  const groupedResults = getOrderedGroupedResults(results);

  return (
    <>
      {/* Search button in header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-xs">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Global Search</DialogTitle>
          </VisuallyHidden>
          
          {/* Search input */}
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search customers, projects, PJOs, invoices..."
              className="border-0 focus-visible:ring-0 text-base h-auto p-0"
              autoFocus
            />
            <kbd className="hidden md:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground ml-2">
              ESC
            </kbd>
          </div>

          {/* Results area */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Searching...
              </div>
            ) : !shouldSearch(query) ? (
              // Show recent searches and quick actions
              <div className="space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(search)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </div>
                  <button
                    onClick={() => {
                      router.push('/proforma-jo/new');
                      setOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New PJO
                    </span>
                    <kbd className="text-xs text-muted-foreground">⌘⇧P</kbd>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/customers/new');
                      setOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Customer
                    </span>
                    <kbd className="text-xs text-muted-foreground">⌘⇧C</kbd>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/vendors/new');
                      setOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Vendor
                    </span>
                    <kbd className="text-xs text-muted-foreground">⌘⇧V</kbd>
                  </button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              // Show grouped results
              <div className="space-y-4">
                {groupedResults.map(([entityType, items]) => {
                  const Icon = ENTITY_ICONS[entityType] || FileText;
                  return (
                    <div key={entityType}>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {ENTITY_LABELS[entityType] || entityType}
                      </div>
                      {items.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={result.entity_id}
                            onClick={() => navigateToResult(result)}
                            className={`flex items-center gap-3 w-full px-2 py-2 text-sm rounded text-left transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {result.primary_text}
                              </div>
                              {result.secondary_text && (
                                <div
                                  className={`text-xs truncate ${
                                    isSelected
                                      ? 'text-primary-foreground/80'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {result.secondary_text}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border bg-muted px-1">↵</kbd> to select
              <kbd className="ml-2 rounded border bg-muted px-1">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="rounded border bg-muted px-1">esc</kbd> to close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
