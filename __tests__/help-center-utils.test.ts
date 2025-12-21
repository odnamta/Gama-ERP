/**
 * Help Center Utility Functions - Unit Tests
 * v0.38: Help Center & Documentation
 */

import { describe, it, expect } from 'vitest';
import {
  mapDbRowToArticle,
  mapDbRowToFAQ,
  filterArticlesByRole,
  filterFAQsByRole,
  filterArticlesByRoute,
  sortArticlesByDisplayOrder,
  sortFAQsByDisplayOrder,
  groupArticlesByCategory,
  groupFAQsByCategory,
  calculateCategoryCounts,
  filterArticlesByCategory,
  getCategoryDisplayInfo,
  getArticleUrl,
  getCategoryUrl,
  isValidCategory,
  isValidSearchQuery,
  highlightSearchTerms,
  truncateText,
  stripHtmlTags,
} from '@/lib/help-center-utils';
import {
  HelpArticle,
  HelpArticleRow,
  HelpFAQ,
  HelpFAQRow,
} from '@/types/help-center';

// =====================================================
// Test Data
// =====================================================

const mockArticleRow: HelpArticleRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  article_slug: 'getting-started',
  title: 'Getting Started',
  summary: 'Quick introduction',
  content: '# Getting Started\n\nWelcome!',
  category: 'getting_started',
  tags: ['intro', 'basics'],
  applicable_roles: ['owner', 'admin'],
  related_routes: ['/dashboard'],
  related_articles: [],
  view_count: 100,
  helpful_count: 50,
  not_helpful_count: 5,
  is_published: true,
  display_order: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockFAQRow: HelpFAQRow = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  question: 'How do I reset my password?',
  answer: 'Click your profile icon...',
  category: 'getting_started',
  applicable_roles: ['owner', 'admin', 'manager'],
  display_order: 1,
  created_at: '2025-01-01T00:00:00Z',
};

// =====================================================
// Data Transformation Tests
// =====================================================

describe('mapDbRowToArticle', () => {
  it('should transform database row to article interface', () => {
    const article = mapDbRowToArticle(mockArticleRow);

    expect(article.id).toBe(mockArticleRow.id);
    expect(article.articleSlug).toBe(mockArticleRow.article_slug);
    expect(article.title).toBe(mockArticleRow.title);
    expect(article.summary).toBe(mockArticleRow.summary);
    expect(article.content).toBe(mockArticleRow.content);
    expect(article.category).toBe(mockArticleRow.category);
    expect(article.tags).toEqual(mockArticleRow.tags);
    expect(article.applicableRoles).toEqual(mockArticleRow.applicable_roles);
    expect(article.relatedRoutes).toEqual(mockArticleRow.related_routes);
    expect(article.viewCount).toBe(mockArticleRow.view_count);
    expect(article.helpfulCount).toBe(mockArticleRow.helpful_count);
    expect(article.notHelpfulCount).toBe(mockArticleRow.not_helpful_count);
    expect(article.isPublished).toBe(mockArticleRow.is_published);
    expect(article.displayOrder).toBe(mockArticleRow.display_order);
  });

  it('should handle null arrays', () => {
    const rowWithNulls = {
      ...mockArticleRow,
      tags: null as unknown as string[],
      applicable_roles: null as unknown as string[],
    };
    const article = mapDbRowToArticle(rowWithNulls);

    expect(article.tags).toEqual([]);
    expect(article.applicableRoles).toEqual([]);
  });
});

describe('mapDbRowToFAQ', () => {
  it('should transform database row to FAQ interface', () => {
    const faq = mapDbRowToFAQ(mockFAQRow);

    expect(faq.id).toBe(mockFAQRow.id);
    expect(faq.question).toBe(mockFAQRow.question);
    expect(faq.answer).toBe(mockFAQRow.answer);
    expect(faq.category).toBe(mockFAQRow.category);
    expect(faq.applicableRoles).toEqual(mockFAQRow.applicable_roles);
    expect(faq.displayOrder).toBe(mockFAQRow.display_order);
    expect(faq.createdAt).toBe(mockFAQRow.created_at);
  });
});

// =====================================================
// Filtering Tests
// =====================================================

describe('filterArticlesByRole', () => {
  const articles: HelpArticle[] = [
    { ...mapDbRowToArticle(mockArticleRow), applicableRoles: ['owner', 'admin'] },
    { ...mapDbRowToArticle(mockArticleRow), id: '2', applicableRoles: ['finance'] },
    { ...mapDbRowToArticle(mockArticleRow), id: '3', applicableRoles: [] },
  ];

  it('should include articles where user role is in applicable_roles', () => {
    const filtered = filterArticlesByRole(articles, 'admin');
    expect(filtered.length).toBe(2);
    expect(filtered.some(a => a.id === mockArticleRow.id)).toBe(true);
    expect(filtered.some(a => a.id === '3')).toBe(true);
  });

  it('should include articles with empty applicable_roles', () => {
    const filtered = filterArticlesByRole(articles, 'viewer');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('3');
  });

  it('should exclude articles where user role is not in applicable_roles', () => {
    const filtered = filterArticlesByRole(articles, 'ops');
    expect(filtered.length).toBe(1);
    expect(filtered[0].applicableRoles).toEqual([]);
  });
});

describe('filterArticlesByRoute', () => {
  const articles: HelpArticle[] = [
    { ...mapDbRowToArticle(mockArticleRow), relatedRoutes: ['/dashboard', '/home'] },
    { ...mapDbRowToArticle(mockArticleRow), id: '2', relatedRoutes: ['/quotations'] },
    { ...mapDbRowToArticle(mockArticleRow), id: '3', relatedRoutes: [] },
  ];

  it('should return articles with matching route', () => {
    const filtered = filterArticlesByRoute(articles, '/dashboard');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(mockArticleRow.id);
  });

  it('should handle trailing slashes', () => {
    const filtered = filterArticlesByRoute(articles, '/dashboard/');
    expect(filtered.length).toBe(1);
  });

  it('should return empty array when no matches', () => {
    const filtered = filterArticlesByRoute(articles, '/settings');
    expect(filtered.length).toBe(0);
  });
});

// =====================================================
// Sorting Tests
// =====================================================

describe('sortArticlesByDisplayOrder', () => {
  it('should sort articles in ascending order', () => {
    const articles: HelpArticle[] = [
      { ...mapDbRowToArticle(mockArticleRow), displayOrder: 3 },
      { ...mapDbRowToArticle(mockArticleRow), id: '2', displayOrder: 1 },
      { ...mapDbRowToArticle(mockArticleRow), id: '3', displayOrder: 2 },
    ];

    const sorted = sortArticlesByDisplayOrder(articles);
    expect(sorted[0].displayOrder).toBe(1);
    expect(sorted[1].displayOrder).toBe(2);
    expect(sorted[2].displayOrder).toBe(3);
  });

  it('should not modify original array', () => {
    const articles: HelpArticle[] = [
      { ...mapDbRowToArticle(mockArticleRow), displayOrder: 3 },
      { ...mapDbRowToArticle(mockArticleRow), id: '2', displayOrder: 1 },
    ];
    const originalFirst = articles[0].displayOrder;

    sortArticlesByDisplayOrder(articles);
    expect(articles[0].displayOrder).toBe(originalFirst);
  });
});

// =====================================================
// Grouping Tests
// =====================================================

describe('groupArticlesByCategory', () => {
  it('should group articles by category', () => {
    const articles: HelpArticle[] = [
      { ...mapDbRowToArticle(mockArticleRow), category: 'getting_started' },
      { ...mapDbRowToArticle(mockArticleRow), id: '2', category: 'finance' },
      { ...mapDbRowToArticle(mockArticleRow), id: '3', category: 'getting_started' },
    ];

    const grouped = groupArticlesByCategory(articles);
    expect(grouped.getting_started.length).toBe(2);
    expect(grouped.finance.length).toBe(1);
    expect(grouped.quotations.length).toBe(0);
  });
});

describe('calculateCategoryCounts', () => {
  it('should count articles per category', () => {
    const articles: HelpArticle[] = [
      { ...mapDbRowToArticle(mockArticleRow), category: 'getting_started' },
      { ...mapDbRowToArticle(mockArticleRow), id: '2', category: 'finance' },
      { ...mapDbRowToArticle(mockArticleRow), id: '3', category: 'getting_started' },
    ];

    const counts = calculateCategoryCounts(articles);
    const gettingStarted = counts.find(c => c.category === 'getting_started');
    const finance = counts.find(c => c.category === 'finance');

    expect(gettingStarted?.articleCount).toBe(2);
    expect(finance?.articleCount).toBe(1);
  });

  it('should include all categories even with zero count', () => {
    const counts = calculateCategoryCounts([]);
    expect(counts.length).toBe(7); // All categories
    expect(counts.every(c => c.articleCount === 0)).toBe(true);
  });
});

// =====================================================
// Display Helper Tests
// =====================================================

describe('getCategoryDisplayInfo', () => {
  it('should return label and icon for valid category', () => {
    const info = getCategoryDisplayInfo('getting_started');
    expect(info.label).toBe('Getting Started');
    expect(info.icon).toBe('🚀');
  });

  it('should return label and icon for finance category', () => {
    const info = getCategoryDisplayInfo('finance');
    expect(info.label).toBe('Finance');
    expect(info.icon).toBe('💰');
  });
});

describe('getArticleUrl', () => {
  it('should generate correct URL from slug', () => {
    expect(getArticleUrl('getting-started')).toBe('/help/articles/getting-started');
  });
});

describe('getCategoryUrl', () => {
  it('should generate correct URL from category', () => {
    expect(getCategoryUrl('finance')).toBe('/help/category/finance');
  });
});

// =====================================================
// Validation Tests
// =====================================================

describe('isValidCategory', () => {
  it('should return true for valid categories', () => {
    expect(isValidCategory('getting_started')).toBe(true);
    expect(isValidCategory('finance')).toBe(true);
    expect(isValidCategory('troubleshooting')).toBe(true);
  });

  it('should return false for invalid categories', () => {
    expect(isValidCategory('invalid')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory('FINANCE')).toBe(false);
  });
});

describe('isValidSearchQuery', () => {
  it('should return true for queries with 2+ characters', () => {
    expect(isValidSearchQuery('ab')).toBe(true);
    expect(isValidSearchQuery('hello')).toBe(true);
  });

  it('should return false for queries with less than 2 characters', () => {
    expect(isValidSearchQuery('a')).toBe(false);
    expect(isValidSearchQuery('')).toBe(false);
    expect(isValidSearchQuery(' ')).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(isValidSearchQuery('  ab  ')).toBe(true);
    expect(isValidSearchQuery('  a  ')).toBe(false);
  });
});

// =====================================================
// Search Highlighting Tests
// =====================================================

describe('highlightSearchTerms', () => {
  it('should wrap matching terms with mark tags', () => {
    const result = highlightSearchTerms('Hello world', 'world');
    expect(result).toBe('Hello <mark>world</mark>');
  });

  it('should be case insensitive', () => {
    const result = highlightSearchTerms('Hello World', 'world');
    expect(result).toBe('Hello <mark>World</mark>');
  });

  it('should highlight multiple occurrences', () => {
    const result = highlightSearchTerms('test test test', 'test');
    expect(result).toBe('<mark>test</mark> <mark>test</mark> <mark>test</mark>');
  });

  it('should return original text for invalid query', () => {
    expect(highlightSearchTerms('Hello world', 'a')).toBe('Hello world');
    expect(highlightSearchTerms('Hello world', '')).toBe('Hello world');
  });

  it('should handle multiple search words', () => {
    const result = highlightSearchTerms('Hello beautiful world', 'hello world');
    expect(result).toContain('<mark>Hello</mark>');
    expect(result).toContain('<mark>world</mark>');
  });
});

describe('truncateText', () => {
  it('should truncate text longer than maxLength', () => {
    const result = truncateText('Hello world, this is a long text', 15);
    expect(result).toBe('Hello world,...');
    expect(result.length).toBe(15);
  });

  it('should not truncate text shorter than maxLength', () => {
    const result = truncateText('Hello', 10);
    expect(result).toBe('Hello');
  });

  it('should handle exact length', () => {
    const result = truncateText('Hello', 5);
    expect(result).toBe('Hello');
  });
});

describe('stripHtmlTags', () => {
  it('should remove HTML tags', () => {
    expect(stripHtmlTags('<mark>Hello</mark>')).toBe('Hello');
    expect(stripHtmlTags('<p>Test</p>')).toBe('Test');
  });

  it('should handle multiple tags', () => {
    expect(stripHtmlTags('<mark>Hello</mark> <mark>world</mark>')).toBe('Hello world');
  });

  it('should return original text if no tags', () => {
    expect(stripHtmlTags('Hello world')).toBe('Hello world');
  });
});
