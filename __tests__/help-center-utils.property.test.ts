/**
 * Help Center Utility Functions - Property-Based Tests
 * v0.38: Help Center & Documentation
 * 
 * Feature: help-center
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  mapDbRowToArticle,
  mapDbRowToFAQ,
  filterArticlesByRole,
  filterFAQsByRole,
  filterArticlesByRoute,
  sortArticlesByDisplayOrder,
  sortFAQsByDisplayOrder,
  sortResultsByRelevance,
  groupArticlesByCategory,
  groupFAQsByCategory,
  calculateCategoryCounts,
  filterArticlesByCategory,
  isValidCategory,
  isValidSearchQuery,
  highlightSearchTerms,
} from '@/lib/help-center-utils';
import {
  HelpArticle,
  HelpArticleRow,
  HelpFAQ,
  HelpFAQRow,
  HelpSearchResult,
  HelpArticleCategory,
  HELP_ARTICLE_CATEGORIES,
} from '@/types/help-center';

// =====================================================
// Arbitraries (Generators)
// =====================================================

const categoryArb = fc.constantFrom(...HELP_ARTICLE_CATEGORIES);

// Safe date string arbitrary
const isoDateStringArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
);

const helpArticleRowArb: fc.Arbitrary<HelpArticleRow> = fc.record({
  id: fc.uuid(),
  article_slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  summary: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  category: categoryArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  applicable_roles: fc.array(fc.constantFrom('owner', 'admin', 'manager', 'finance', 'ops', 'sales', 'viewer'), { maxLength: 7 }),
  related_routes: fc.array(fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s), { maxLength: 3 }),
  related_articles: fc.array(fc.uuid(), { maxLength: 3 }),
  view_count: fc.nat({ max: 10000 }),
  helpful_count: fc.nat({ max: 1000 }),
  not_helpful_count: fc.nat({ max: 1000 }),
  is_published: fc.boolean(),
  display_order: fc.nat({ max: 100 }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
});

const helpFAQRowArb: fc.Arbitrary<HelpFAQRow> = fc.record({
  id: fc.uuid(),
  question: fc.string({ minLength: 1, maxLength: 200 }),
  answer: fc.string({ minLength: 1, maxLength: 500 }),
  category: categoryArb,
  applicable_roles: fc.array(fc.constantFrom('owner', 'admin', 'manager', 'finance', 'ops', 'sales', 'viewer'), { maxLength: 7 }),
  display_order: fc.nat({ max: 100 }),
  created_at: isoDateStringArb,
});

const helpArticleArb: fc.Arbitrary<HelpArticle> = helpArticleRowArb.map(row => mapDbRowToArticle(row));

const helpFAQArb: fc.Arbitrary<HelpFAQ> = helpFAQRowArb.map(row => mapDbRowToFAQ(row));

const helpSearchResultArb: fc.Arbitrary<HelpSearchResult> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('article', 'faq') as fc.Arbitrary<'article' | 'faq'>,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  snippet: fc.string({ minLength: 1, maxLength: 200 }),
  category: categoryArb,
  url: fc.string({ minLength: 1, maxLength: 100 }).map(s => '/help/' + s),
  relevance: fc.float({ min: 0, max: 1, noNaN: true }),
});

const userRoleArb = fc.constantFrom('owner', 'admin', 'manager', 'finance', 'ops', 'sales', 'viewer');

// =====================================================
// Property 1: Article Data Transformation Round-Trip
// Feature: help-center, Property 1: Article Data Transformation Round-Trip
// =====================================================

describe('Property 1: Article Data Transformation Round-Trip', () => {
  it('should preserve all field values when transforming HelpArticleRow to HelpArticle', () => {
    fc.assert(
      fc.property(helpArticleRowArb, (row) => {
        const article = mapDbRowToArticle(row);
        
        // Verify all fields are correctly mapped
        expect(article.id).toBe(row.id);
        expect(article.articleSlug).toBe(row.article_slug);
        expect(article.title).toBe(row.title);
        expect(article.summary).toBe(row.summary);
        expect(article.content).toBe(row.content);
        expect(article.category).toBe(row.category);
        expect(article.tags).toEqual(row.tags || []);
        expect(article.applicableRoles).toEqual(row.applicable_roles || []);
        expect(article.relatedRoutes).toEqual(row.related_routes || []);
        expect(article.relatedArticles).toEqual(row.related_articles || []);
        expect(article.viewCount).toBe(row.view_count);
        expect(article.helpfulCount).toBe(row.helpful_count);
        expect(article.notHelpfulCount).toBe(row.not_helpful_count);
        expect(article.isPublished).toBe(row.is_published);
        expect(article.displayOrder).toBe(row.display_order);
        expect(article.createdAt).toBe(row.created_at);
        expect(article.updatedAt).toBe(row.updated_at);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 2: FAQ Data Transformation Round-Trip
// Feature: help-center, Property 2: FAQ Data Transformation Round-Trip
// =====================================================

describe('Property 2: FAQ Data Transformation Round-Trip', () => {
  it('should preserve all field values when transforming HelpFAQRow to HelpFAQ', () => {
    fc.assert(
      fc.property(helpFAQRowArb, (row) => {
        const faq = mapDbRowToFAQ(row);
        
        // Verify all fields are correctly mapped
        expect(faq.id).toBe(row.id);
        expect(faq.question).toBe(row.question);
        expect(faq.answer).toBe(row.answer);
        expect(faq.category).toBe(row.category);
        expect(faq.applicableRoles).toEqual(row.applicable_roles || []);
        expect(faq.displayOrder).toBe(row.display_order);
        expect(faq.createdAt).toBe(row.created_at);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// Property 3: Category Validation
// Feature: help-center, Property 3: Category Validation
// =====================================================

describe('Property 3: Category Validation', () => {
  it('should return true only for valid categories', () => {
    fc.assert(
      fc.property(categoryArb, (category) => {
        expect(isValidCategory(category)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for invalid categories', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !HELP_ARTICLE_CATEGORIES.includes(s as HelpArticleCategory)),
        (invalidCategory) => {
          expect(isValidCategory(invalidCategory)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 4: Category Article Count Calculation
// Feature: help-center, Property 4: Category Article Count Calculation
// =====================================================

describe('Property 4: Category Article Count Calculation', () => {
  it('should correctly count articles per category', () => {
    fc.assert(
      fc.property(fc.array(helpArticleArb, { maxLength: 20 }), (articles) => {
        const categoryCounts = calculateCategoryCounts(articles);
        
        // Verify each category count matches actual count
        for (const categoryInfo of categoryCounts) {
          const actualCount = articles.filter(a => a.category === categoryInfo.category).length;
          expect(categoryInfo.articleCount).toBe(actualCount);
        }
        
        // Verify all categories are represented
        expect(categoryCounts.length).toBe(HELP_ARTICLE_CATEGORIES.length);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 5: Search Results Relevance Ordering
// Feature: help-center, Property 5: Search Results Relevance Ordering
// =====================================================

describe('Property 5: Search Results Relevance Ordering', () => {
  it('should sort results in descending order by relevance', () => {
    fc.assert(
      fc.property(fc.array(helpSearchResultArb, { maxLength: 20 }), (results) => {
        const sorted = sortResultsByRelevance(results);
        
        // Verify descending order
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].relevance).toBeGreaterThanOrEqual(sorted[i].relevance);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all original results after sorting', () => {
    fc.assert(
      fc.property(fc.array(helpSearchResultArb, { maxLength: 20 }), (results) => {
        const sorted = sortResultsByRelevance(results);
        
        expect(sorted.length).toBe(results.length);
        
        // Every original result should be in sorted results
        for (const result of results) {
          expect(sorted.some(s => s.id === result.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 6: Search Term Highlighting
// Feature: help-center, Property 6: Search Term Highlighting
// =====================================================

describe('Property 6: Search Term Highlighting', () => {
  it('should wrap matching terms with mark tags', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        (text, searchTerm) => {
          // Create text that contains the search term
          const textWithTerm = text + ' ' + searchTerm + ' ' + text;
          const highlighted = highlightSearchTerms(textWithTerm, searchTerm);
          
          // Should contain mark tags if term was found
          if (textWithTerm.toLowerCase().includes(searchTerm.toLowerCase())) {
            expect(highlighted).toContain('<mark>');
            expect(highlighted).toContain('</mark>');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original text content (without tags)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        (text, searchTerm) => {
          const highlighted = highlightSearchTerms(text, searchTerm);
          const stripped = highlighted.replace(/<\/?mark>/g, '');
          
          expect(stripped).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return original text for invalid queries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ maxLength: 1 }), // Too short to be valid
        (text, shortQuery) => {
          const result = highlightSearchTerms(text, shortQuery);
          expect(result).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 7: FAQ Grouping and Sorting
// Feature: help-center, Property 7: FAQ Grouping and Sorting
// =====================================================

describe('Property 7: FAQ Grouping and Sorting', () => {
  it('should place each FAQ in exactly one category group', () => {
    fc.assert(
      fc.property(fc.array(helpFAQArb, { maxLength: 20 }), (faqs) => {
        const grouped = groupFAQsByCategory(faqs);
        
        // Count total FAQs in all groups
        let totalInGroups = 0;
        for (const category of HELP_ARTICLE_CATEGORIES) {
          totalInGroups += grouped[category].length;
        }
        
        expect(totalInGroups).toBe(faqs.length);
        
        // Each FAQ should be in its correct category
        for (const faq of faqs) {
          expect(grouped[faq.category].some(f => f.id === faq.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should sort FAQs within each group by display_order', () => {
    fc.assert(
      fc.property(fc.array(helpFAQArb, { maxLength: 20 }), (faqs) => {
        const grouped = groupFAQsByCategory(faqs);
        
        for (const category of HELP_ARTICLE_CATEGORIES) {
          const group = grouped[category];
          for (let i = 1; i < group.length; i++) {
            expect(group[i - 1].displayOrder).toBeLessThanOrEqual(group[i].displayOrder);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 8: Route-Based Article Filtering
// Feature: help-center, Property 8: Route-Based Article Filtering
// =====================================================

describe('Property 8: Route-Based Article Filtering', () => {
  it('should return only articles with matching related_routes', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb, { maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => '/' + s.replace(/[^a-z0-9]/gi, '')),
        (articles, route) => {
          const filtered = filterArticlesByRoute(articles, route);
          
          // All filtered articles should have the route in related_routes
          for (const article of filtered) {
            const normalizedRoute = route.replace(/\/$/, '');
            const hasRoute = article.relatedRoutes.some(r => 
              r.replace(/\/$/, '') === normalizedRoute
            );
            expect(hasRoute).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no articles match', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb.map(a => ({ ...a, relatedRoutes: [] })), { maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => '/' + s),
        (articlesWithNoRoutes, route) => {
          const filtered = filterArticlesByRoute(articlesWithNoRoutes, route);
          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 9: Role-Based Content Filtering
// Feature: help-center, Property 9: Role-Based Content Filtering
// =====================================================

describe('Property 9: Role-Based Content Filtering', () => {
  it('should include articles where user role is in applicable_roles', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb, { maxLength: 20 }),
        userRoleArb,
        (articles, userRole) => {
          const filtered = filterArticlesByRole(articles, userRole);
          
          for (const article of filtered) {
            const hasRole = article.applicableRoles.length === 0 || 
                           article.applicableRoles.includes(userRole);
            expect(hasRole).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include articles with empty applicable_roles (available to all)', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb.map(a => ({ ...a, applicableRoles: [] })), { maxLength: 10 }),
        userRoleArb,
        (articlesForAll, userRole) => {
          const filtered = filterArticlesByRole(articlesForAll, userRole);
          expect(filtered.length).toBe(articlesForAll.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter FAQs by role correctly', () => {
    fc.assert(
      fc.property(
        fc.array(helpFAQArb, { maxLength: 20 }),
        userRoleArb,
        (faqs, userRole) => {
          const filtered = filterFAQsByRole(faqs, userRole);
          
          for (const faq of filtered) {
            const hasRole = faq.applicableRoles.length === 0 || 
                           faq.applicableRoles.includes(userRole);
            expect(hasRole).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 10: Category-Based Article Filtering and Sorting
// Feature: help-center, Property 10: Category-Based Article Filtering and Sorting
// =====================================================

describe('Property 10: Category-Based Article Filtering and Sorting', () => {
  it('should return only articles with matching category', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb, { maxLength: 20 }),
        categoryArb,
        (articles, category) => {
          const filtered = filterArticlesByCategory(articles, category);
          
          for (const article of filtered) {
            expect(article.category).toBe(category);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort filtered articles by display_order', () => {
    fc.assert(
      fc.property(
        fc.array(helpArticleArb, { maxLength: 20 }),
        categoryArb,
        (articles, category) => {
          const filtered = filterArticlesByCategory(articles, category);
          
          for (let i = 1; i < filtered.length; i++) {
            expect(filtered[i - 1].displayOrder).toBeLessThanOrEqual(filtered[i].displayOrder);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// Property 11: Display Order Sorting Invariant
// Feature: help-center, Property 11: Display Order Sorting Invariant
// =====================================================

describe('Property 11: Display Order Sorting Invariant', () => {
  it('should maintain ascending display_order for articles', () => {
    fc.assert(
      fc.property(fc.array(helpArticleArb, { maxLength: 20 }), (articles) => {
        const sorted = sortArticlesByDisplayOrder(articles);
        
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].displayOrder).toBeLessThanOrEqual(sorted[i].displayOrder);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain ascending display_order for FAQs', () => {
    fc.assert(
      fc.property(fc.array(helpFAQArb, { maxLength: 20 }), (faqs) => {
        const sorted = sortFAQsByDisplayOrder(faqs);
        
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].displayOrder).toBeLessThanOrEqual(sorted[i].displayOrder);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify the original array', () => {
    fc.assert(
      fc.property(fc.array(helpArticleArb, { maxLength: 20 }), (articles) => {
        const originalOrder = articles.map(a => a.id);
        sortArticlesByDisplayOrder(articles);
        const afterSort = articles.map(a => a.id);
        
        expect(afterSort).toEqual(originalOrder);
      }),
      { numRuns: 100 }
    );
  });
});
