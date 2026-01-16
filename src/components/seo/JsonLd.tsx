import { Helmet } from "react-helmet";
import { seoConfig } from "@/lib/seo-config";

// Organization Schema
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.organization.name,
    legalName: seoConfig.organization.legalName,
    url: seoConfig.organization.url,
    logo: seoConfig.organization.logo,
    foundingDate: seoConfig.organization.foundingDate,
    address: {
      "@type": "PostalAddress",
      ...seoConfig.organization.address,
    },
    contactPoint: {
      "@type": "ContactPoint",
      ...seoConfig.organization.contactPoint,
    },
    sameAs: seoConfig.organization.sameAs,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Software Application Schema
export function SoftwareApplicationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoConfig.software.name,
    applicationCategory: seoConfig.software.applicationCategory,
    operatingSystem: seoConfig.software.operatingSystem,
    offers: {
      "@type": "Offer",
      price: seoConfig.software.offers.price,
      priceCurrency: seoConfig.software.offers.priceCurrency,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "50",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ Schema
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Product Schema (for product pages)
interface ProductJsonLdProps {
  name: string;
  description: string;
  price: string;
  currency?: string;
  image?: string;
}

export function ProductJsonLd({
  name,
  description,
  price,
  currency = "USD",
  image,
}: ProductJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || seoConfig.defaultOgImage,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
    brand: {
      "@type": "Brand",
      name: seoConfig.siteName,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// WebPage Schema (generic)
interface WebPageJsonLdProps {
  name: string;
  description: string;
  url: string;
}

export function WebPageJsonLd({ name, description, url }: WebPageJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
