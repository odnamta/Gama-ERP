/**
 * Help Center Utility Functions
 * v0.38: Help Center & Documentation
 */

import {
  HelpArticle,
  HelpArticleRow,
  HelpFAQ,
  HelpFAQRow,
  HelpArticleCategory,
  HelpCategoryInfo,
  HelpSearchResult,
  HELP_ARTICLE_CATEGORIES,
  CATEGORY_DISPLAY,
} from '@/types/help-center';

// =====================================================
// Data Transformation Functions
// =====================================================

/**
 * Transform database row to HelpArticle interface
 */
export function mapDbRowToArticle(row: HelpArticleRow): HelpArticle {
  return {
    id: row.id,
    articleSlug: row.article_slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    applicableRoles: row.applicable_roles || [],
    relatedRoutes: row.related_routes || [],
    relatedArticles: row.related_articles || [],
    viewCount: row.view_count,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    isPublished: row.is_published,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform database row to HelpFAQ interface
 */
export function mapDbRowToFAQ(row: HelpFAQRow): HelpFAQ {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    applicableRoles: row.applicable_roles || [],
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

// =====================================================
// Role-Based Filtering Functions
// =====================================================

/**
 * Filter articles based on user role
 * An article is included if:
 * - The user's role is in the article's applicable_roles array, OR
 * - The article's applicable_roles array is empty (available to all)
 */
export function filterArticlesByRole(
  articles: HelpArticle[],
  userRole: string
): HelpArticle[] {
  return articles.filter(article => {
    // Empty applicable_roles means available to all
    if (article.applicableRoles.length === 0) return true;
    // Check if user's role is in applicable_roles
    return article.applicableRoles.includes(userRole);
  });
}

/**
 * Filter FAQs based on user role
 * A FAQ is included if:
 * - The user's role is in the FAQ's applicable_roles array, OR
 * - The FAQ's applicable_roles array is empty (available to all)
 */
export function filterFAQsByRole(
  faqs: HelpFAQ[],
  userRole: string
): HelpFAQ[] {
  return faqs.filter(faq => {
    // Empty applicable_roles means available to all
    if (faq.applicableRoles.length === 0) return true;
    // Check if user's role is in applicable_roles
    return faq.applicableRoles.includes(userRole);
  });
}

// =====================================================
// Route-Based Filtering Functions
// =====================================================

/**
 * Filter articles by related route for contextual help
 * Returns articles where related_routes contains the current route
 */
export function filterArticlesByRoute(
  articles: HelpArticle[],
  currentRoute: string
): HelpArticle[] {
  // Normalize route by removing trailing slash
  const normalizedRoute = currentRoute.replace(/\/$/, '');
  
  return articles.filter(article => {
    return article.relatedRoutes.some(route => {
      const normalizedArticleRoute = route.replace(/\/$/, '');
      return normalizedArticleRoute === normalizedRoute;
    });
  });
}


// =====================================================
// Sorting Functions
// =====================================================

/**
 * Sort articles by display order (ascending)
 */
export function sortArticlesByDisplayOrder(
  articles: HelpArticle[]
): HelpArticle[] {
  return [...articles].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Sort FAQs by display order (ascending)
 */
export function sortFAQsByDisplayOrder(
  faqs: HelpFAQ[]
): HelpFAQ[] {
  return [...faqs].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Sort search results by relevance (descending)
 */
export function sortResultsByRelevance(
  results: HelpSearchResult[]
): HelpSearchResult[] {
  return [...results].sort((a, b) => b.relevance - a.relevance);
}

/**
 * Check if articles are sorted by display order
 */
export function isSortedByDisplayOrder(articles: HelpArticle[]): boolean {
  for (let i = 1; i < articles.length; i++) {
    if (articles[i].displayOrder < articles[i - 1].displayOrder) {
      return false;
    }
  }
  return true;
}

// =====================================================
// Grouping Functions
// =====================================================

/**
 * Group articles by category
 */
export function groupArticlesByCategory(
  articles: HelpArticle[]
): Record<HelpArticleCategory, HelpArticle[]> {
  const grouped: Record<HelpArticleCategory, HelpArticle[]> = {
    getting_started: [],
    quotations: [],
    jobs: [],
    finance: [],
    hr: [],
    reports: [],
    troubleshooting: [],
  };

  for (const article of articles) {
    if (grouped[article.category]) {
      grouped[article.category].push(article);
    }
  }

  // Sort each category by display_order
  for (const category of HELP_ARTICLE_CATEGORIES) {
    grouped[category].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return grouped;
}

/**
 * Group FAQs by category
 */
export function groupFAQsByCategory(
  faqs: HelpFAQ[]
): Record<HelpArticleCategory, HelpFAQ[]> {
  const grouped: Record<HelpArticleCategory, HelpFAQ[]> = {
    getting_started: [],
    quotations: [],
    jobs: [],
    finance: [],
    hr: [],
    reports: [],
    troubleshooting: [],
  };

  for (const faq of faqs) {
    if (grouped[faq.category]) {
      grouped[faq.category].push(faq);
    }
  }

  // Sort each category by display_order
  for (const category of HELP_ARTICLE_CATEGORIES) {
    grouped[category].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return grouped;
}

/**
 * Calculate category article counts
 */
export function calculateCategoryCounts(
  articles: HelpArticle[]
): HelpCategoryInfo[] {
  const counts: Record<HelpArticleCategory, number> = {
    getting_started: 0,
    quotations: 0,
    jobs: 0,
    finance: 0,
    hr: 0,
    reports: 0,
    troubleshooting: 0,
  };

  for (const article of articles) {
    if (counts[article.category] !== undefined) {
      counts[article.category]++;
    }
  }

  return HELP_ARTICLE_CATEGORIES.map(category => ({
    category,
    label: CATEGORY_DISPLAY[category].label,
    icon: CATEGORY_DISPLAY[category].icon,
    articleCount: counts[category],
  }));
}

// =====================================================
// Category Filtering Functions
// =====================================================

/**
 * Filter articles by category
 */
export function filterArticlesByCategory(
  articles: HelpArticle[],
  category: HelpArticleCategory
): HelpArticle[] {
  const filtered = articles.filter(article => article.category === category);
  return sortArticlesByDisplayOrder(filtered);
}

// =====================================================
// Display Helper Functions
// =====================================================

/**
 * Get category display info (label and icon)
 */
export function getCategoryDisplayInfo(
  category: HelpArticleCategory
): { label: string; icon: string } {
  return CATEGORY_DISPLAY[category] || { label: category, icon: '📄' };
}

/**
 * Generate article URL from slug
 */
export function getArticleUrl(slug: string): string {
  return `/help/articles/${slug}`;
}

/**
 * Generate category URL
 */
export function getCategoryUrl(category: HelpArticleCategory): string {
  return `/help/category/${category}`;
}

// =====================================================
// Validation Functions
// =====================================================

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): category is HelpArticleCategory {
  return HELP_ARTICLE_CATEGORIES.includes(category as HelpArticleCategory);
}

/**
 * Check if search query is valid (minimum 2 characters)
 */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2;
}

// =====================================================
// Search Highlighting Functions
// =====================================================

/**
 * Highlight search terms in text
 * Wraps matching terms with <mark> tags
 */
export function highlightSearchTerms(
  text: string,
  searchQuery: string
): string {
  if (!text || !searchQuery || !isValidSearchQuery(searchQuery)) {
    return text;
  }

  // Split query into words and escape special regex characters
  const words = searchQuery.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return text;
  }

  // Create regex pattern for all words (case insensitive)
  const escapedWords = words.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');

  // Replace matches with highlighted version
  return text.replace(pattern, '<mark>$1</mark>');
}

/**
 * Strip HTML tags from text (for plain text display)
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
