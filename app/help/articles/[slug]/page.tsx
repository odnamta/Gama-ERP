/**
 * Help Article Detail Page
 * v0.38: Help Center & Documentation
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HelpFeedback } from '@/components/help-center/help-feedback';
import { HelpArticleCard } from '@/components/help-center/help-article-card';
import { 
  getArticleBySlug, 
  getRelatedArticles,
  incrementViewCount 
} from '@/lib/help-center-actions';
import { getCategoryDisplayInfo } from '@/lib/help-center-utils';
import { MarkdownContent } from './markdown-content';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(article.id).catch(() => {});

  // Get related articles
  const relatedArticles = article.relatedArticles.length > 0
    ? await getRelatedArticles(article.relatedArticles)
    : [];

  const categoryInfo = getCategoryDisplayInfo(article.category);

  return (
    <div className="container max-w-3xl py-8">
      {/* Back link */}
      <Link href="/help">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Help Center
        </Button>
      </Link>

      {/* Article header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">
            {categoryInfo.icon} {categoryInfo.label}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
        {article.summary && (
          <p className="text-lg text-muted-foreground">{article.summary}</p>
        )}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="my-6" />

      {/* Article content */}
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <MarkdownContent content={article.content} />
      </article>

      <Separator className="my-8" />

      {/* Feedback */}
      <div className="flex justify-center">
        <HelpFeedback articleId={article.id} />
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((related) => (
                <HelpArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
