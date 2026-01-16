import { useParams, Navigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/JsonLd";
import { ArticleHero } from "@/components/blog/ArticleHero";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { KeyTakeaways } from "@/components/blog/KeyTakeaways";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { getArticleBySlug, getRelatedArticles } from "@/data/blogArticles";
import { seoConfig } from "@/lib/seo-config";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Key takeaways for each article (could be moved to article data)
const articleTakeaways: Record<string, string[]> = {
  "complete-feasibility-guide": [
    "A feasibility study evaluates regulatory, physical, and financial viability before acquisition",
    "Key components include zoning, flood zones, utilities, environmental, and market analysis",
    "AI-powered platforms reduce costs from $10K-$25K to $795 while delivering same data sources",
    "Lenders require verifiable citations from authoritative sources like FEMA and county CAD",
    "The hybrid approach—AI screening then selective traditional analysis—maximizes ROI",
  ],
  "fema-flood-zones-guide": [
    "Zone AE is the most common high-risk designation with established Base Flood Elevation",
    "Zone X (unshaded) is lowest risk and most desirable for development",
    "Post-Harvey, most Texas jurisdictions require 2 feet of freeboard above BFE",
    "Flood insurance in Zone AE can cost $25K-$50K annually for commercial buildings",
    "LOMAs and LOMRs can remove properties from high-risk zones with proper documentation",
  ],
  "houston-commercial-development-guide-2026": [
    "Houston has no formal zoning but uses deed restrictions, Chapter 42, and overlays",
    "Post-Harvey flood regulations require 2-foot freeboard in expanded floodplain areas",
    "Key growth corridors include Katy, Sugar Land, The Woodlands, and East Houston",
    "Industrial sector outperforms with 5.2% vacancy; office struggles at 22.1%",
    "Always start TxDOT permits early—they have the longest lead times",
  ],
  "ai-vs-traditional-feasibility-study": [
    "Traditional feasibility studies cost $10K-$25K and take 2-4 weeks",
    "AI-powered reports deliver the same data sources for $795 in 10 minutes",
    "Both approaches use identical authoritative data (FEMA, CAD, EPA, TxDOT)",
    "Traditional consultants add value for entitlements, relationships, and complex sites",
    "The hybrid approach screens 10 sites with AI, then deep-dives 2-3 with consultants",
  ],
  "developer-due-diligence-checklist": [
    "50 items across 7 categories ensure comprehensive pre-acquisition analysis",
    "Environmental contamination and floodway designation are immediate deal-killers",
    "Always verify zoning permits your intended use as-of-right before proceeding",
    "Utility capacity letters are essential—don't rely on assumptions",
    "AI platforms can automate 20+ checklist items in 10 minutes",
  ],
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  
  if (!slug) {
    return <Navigate to="/resources/blog" replace />;
  }

  const article = getArticleBySlug(slug);
  
  if (!article) {
    return <Navigate to="/resources/blog" replace />;
  }

  const relatedArticles = getRelatedArticles(slug);
  const takeaways = articleTakeaways[slug] || [];

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.seo.metaDescription}
        keywords={article.seo.keywords}
        ogType="article"
        publishedTime={article.publishedDate}
        modifiedTime={article.modifiedDate}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: seoConfig.siteUrl },
          { name: "Blog", url: `${seoConfig.siteUrl}/resources/blog` },
          { name: article.title, url: `${seoConfig.siteUrl}/resources/blog/${slug}` },
        ]}
      />
      <ArticleJsonLd
        headline={article.title}
        author={article.author.name}
        datePublished={article.publishedDate}
        dateModified={article.modifiedDate}
        description={article.seo.metaDescription}
      />

      <div className="min-h-screen bg-background">
        {/* Back to Blog */}
        <div className="container max-w-4xl mx-auto px-4 pt-6">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
            <Link to="/resources/blog">
              <ChevronLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        {/* Hero */}
        <ArticleHero
          title={article.title}
          excerpt={article.excerpt}
          author={article.author}
          publishedDate={article.publishedDate}
          readTime={article.readTime}
          category={article.category}
          tags={article.tags}
          featuredImage={article.featuredImage}
        />

        {/* Content Area */}
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12">
            {/* Main Content */}
            <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted prose-td:border prose-td:border-border prose-td:p-3 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
              {/* Key Takeaways */}
              {takeaways.length > 0 && <KeyTakeaways takeaways={takeaways} />}
              
              {/* Article Content */}
              <div dangerouslySetInnerHTML={{ __html: formatContent(article.content) }} />

              {/* Inline CTA */}
              <ArticleCTA variant="inline" />
            </article>

            {/* Sidebar - TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents className="p-4 rounded-lg border border-border bg-muted/30" />
              </div>
            </aside>
          </div>
        </div>

        {/* Full CTA */}
        <div className="container max-w-4xl mx-auto px-4">
          <ArticleCTA variant="full" />
        </div>

        {/* Author Bio */}
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <AuthorBio author={article.author} />
        </div>

        {/* Related Articles */}
        <div className="container max-w-4xl mx-auto px-4 pb-20">
          <RelatedArticles articles={relatedArticles} />
        </div>
      </div>
    </>
  );
}

// Simple markdown-like content formatter
function formatContent(content: string): string {
  return content
    // Headers
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    // Bold and Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Tables (basic support)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => c.trim().match(/^-+$/))) {
        return ''; // Skip separator rows
      }
      const isHeader = cells.every(c => c.trim().length > 0);
      const tag = isHeader ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Checkboxes
    .replace(/^☐ (.+)$/gm, '<li class="flex items-start gap-2"><span class="text-muted-foreground">☐</span><span>$1</span></li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-border" />')
    // Paragraphs (wrap remaining text)
    .replace(/^(?!<[hlu]|<li|<tr|<hr)(.+)$/gm, '<p>$1</p>')
    // Wrap lists
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Clean up empty elements
    .replace(/<p><\/p>/g, '')
    .replace(/<ul><\/ul>/g, '');
}
