/**
 * Help Center Types
 * v0.38: Help Center & Documentation
 */

// Help article categories
export type HelpArticleCategory =
  | 'getting_started'
  | 'quotations'
  | 'jobs'
  | 'finance'
  | 'hr'
  | 'reports'
  | 'troubleshooting';

// Valid categories array for validation
export const HELP_ARTICLE_CATEGORIES: HelpArticleCategory[] = [
  'getting_started',
  'quotations',
  'jobs',
  'finance',
  'hr',
  'reports',
  'troubleshooting',
];

// Help article interface (camelCase for application use)
export interface HelpArticle {
  id: string;
  articleSlug: string;
  title: string;
  summary: string | null;
  content: string;
  category: HelpArticleCategory;
  tags: string[];
  applicableRoles: string[];
  relatedRoutes: string[];
  relatedArticles: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Database row type for help_articles (snake_case from database)
export interface HelpArticleRow {
  id: string;
  article_slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: HelpArticleCategory;
  tags: string[];
  applicable_roles: string[];
  related_routes: string[];
  related_articles: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// FAQ interface (camelCase for application use)
export interface HelpFAQ {
  id: string;
  question: string;
  answer: string;
  category: HelpArticleCategory;
  applicableRoles: string[];
  displayOrder: number;
  createdAt: string;
}

// Database row type for help_faqs (snake_case from database)
export interface HelpFAQRow {
  id: string;
  question: string;
  answer: string;
  category: HelpArticleCategory;
  applicable_roles: string[];
  display_order: number;
  created_at: string;
}

// Search result interface
export interface HelpSearchResult {
  id: string;
  type: 'article' | 'faq';
  title: string;
  snippet: string;
  category: HelpArticleCategory;
  url: string;
  relevance: number;
}

// Category with article count for display
export interface HelpCategoryInfo {
  category: HelpArticleCategory;
  label: string;
  icon: string;
  articleCount: number;
}

// Feedback type for article helpfulness
export type FeedbackType = 'helpful' | 'not_helpful';

// Category display configuration
export const CATEGORY_DISPLAY: Record<HelpArticleCategory, { label: string; icon: string }> = {
  getting_started: { label: 'Getting Started', icon: '🚀' },
  quotations: { label: 'Quotations', icon: '📝' },
  jobs: { label: 'Job Orders', icon: '📦' },
  finance: { label: 'Finance', icon: '💰' },
  hr: { label: 'HR', icon: '👥' },
  reports: { label: 'Reports', icon: '📊' },
  troubleshooting: { label: 'Troubleshooting', icon: '🔧' },
};
