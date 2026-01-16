import { Helmet } from "react-helmet";
import { seoConfig, generateTitle, generateCanonical, pageSeoConfig } from "@/lib/seo-config";
import { useLocation } from "react-router-dom";

export interface SEOHeadProps {
  /** Page title (will be appended with site name) */
  title?: string;
  /** Meta description (max 160 chars recommended) */
  description?: string;
  /** Canonical URL path (e.g., "/products/feasibility") */
  canonical?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Open Graph type */
  ogType?: "website" | "article" | "product";
  /** Prevent indexing */
  noIndex?: boolean;
  /** Additional keywords */
  keywords?: string[];
  /** Custom JSON-LD structured data */
  jsonLd?: object;
  /** Article publish date (for og:article) */
  publishedTime?: string;
  /** Article modified date */
  modifiedTime?: string;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  keywords = [],
  jsonLd,
  publishedTime,
  modifiedTime,
}: SEOHeadProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Get page-specific defaults if available
  const pageDefaults = pageSeoConfig[currentPath];
  
  // Resolve final values
  const finalTitle = generateTitle(title || pageDefaults?.title);
  const finalDescription = description || pageDefaults?.description || seoConfig.defaultDescription;
  const finalCanonical = generateCanonical(canonical || currentPath);
  const finalOgImage = ogImage || seoConfig.defaultOgImage;
  const finalKeywords = [...(pageDefaults?.keywords || []), ...keywords];

  // Build robots directive
  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="robots" content={robotsContent} />
      {finalKeywords.length > 0 && (
        <meta name="keywords" content={finalKeywords.join(", ")} />
      )}
      <link rel="canonical" href={finalCanonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:site_name" content={seoConfig.siteName} />

      {/* Article-specific OG tags */}
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={seoConfig.twitterHandle} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default SEOHead;
