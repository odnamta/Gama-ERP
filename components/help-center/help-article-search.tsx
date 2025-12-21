'use client';

/**
 * Help Article Search Component
 * v0.38: Help Center & Documentation
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HelpSearchResult } from '@/types/help-center';
import { searchHelpContent } from '@/lib/help-center-actions';
import { highlightSearchTerms, isValidSearchQuery } from '@/lib/help-center-utils';

interface HelpArticleSearchProps {
  userRole: string;
  placeholder?: string;
}

export function HelpArticleSearch({ 
  userRole, 
  placeholder = 'Search help articles...' 
}: HelpArticleSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!isValidSearchQuery(searchQuery)) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchHelpContent(searchQuery, userRole);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: HelpSearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.url);
  };

  const articleResults = results.filter(r => r.type === 'article');
  const faqResults = results.filter(r => r.type === 'faq');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setOpen(true);
            }}
            onFocus={() => query && setOpen(true)}
            className="pl-10"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            )}
            {!isLoading && query && results.length === 0 && (
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try different keywords or browse categories
                  </p>
                </div>
              </CommandEmpty>
            )}
            {articleResults.length > 0 && (
              <CommandGroup heading="Articles">
                {articleResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex-1 overflow-hidden">
                      <p 
                        className="text-sm truncate"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(result.title, query) 
                        }}
                      />
                      <p 
                        className="text-xs text-muted-foreground truncate"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(result.snippet, query) 
                        }}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {faqResults.length > 0 && (
              <CommandGroup heading="FAQs">
                {faqResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <div className="flex-1 overflow-hidden">
                      <p 
                        className="text-sm truncate"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(result.title, query) 
                        }}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
