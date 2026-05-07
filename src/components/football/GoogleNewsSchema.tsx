'use client';

import { useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   GoogleNewsSchema
   ─────────────────────────────────────────────────────────────
   Generates a <script type="application/ld+json"> containing
   a Schema.org NewsArticle object and injects it into <head>.
   Used inside ArticleModal so every opened article gets proper
   structured data for Google News & Google Discover.

   REF: https://developers.google.com/search/docs/appearance/structured-data/article
   REF: https://schema.org/NewsArticle
   ───────────────────────────────────────────────────────────── */

/** Minimal article shape accepted by this component */
export interface NewsSchemaArticle {
  title: string;
  slug: string;
  /** Full HTML content — used to estimate wordCount */
  content?: string;
  /** Short summary / excerpt */
  summary?: string | null;
  /** Cover image URL */
  imageUrl?: string | null;
  /** Category name — maps to articleSection */
  categoryName?: string;
  /** Author display name */
  authorName?: string;
  /** Read time in minutes — used to estimate wordCount if no content */
  readTime?: number;
  /** ISO-8601 publish date */
  publishedAt?: string | null;
  /** ISO-8601 modification date */
  updatedAt?: string;
  /** ISO-8601 creation date */
  createdAt?: string;
}

/** Site-level config (injected once, defaults to GOALZONE values) */
interface PublisherConfig {
  name: string;
  url: string;
  logo?: string;
}

const DEFAULT_PUBLISHER: PublisherConfig = {
  name: 'GOALZONE',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://goalzone.vercel.app',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://goalzone.vercel.app'}/logo.svg`,
};

/** Unique script id so we can clean up / replace between articles */
const SCRIPT_ID = 'google-news-schema-jsonld';

/**
 * Strip HTML tags and count words in plain text.
 */
function countWords(html?: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Estimate word count: prefer actual content, fallback to ~250 words/min readTime.
 */
function estimateWordCount(article: NewsSchemaArticle): number {
  const fromContent = countWords(article.content);
  if (fromContent > 0) return fromContent;
  return (article.readTime || 5) * 250;
}

/**
 * Pick the best publish date from available timestamps.
 */
function pickDate(article: NewsSchemaArticle): string {
  return (
    article.publishedAt ||
    article.createdAt ||
    new Date().toISOString()
  );
}

/**
 * Build the full JSON-LD object conforming to Schema.org NewsArticle.
 */
function buildJsonLd(
  article: NewsSchemaArticle,
  publisher: PublisherConfig,
): Record<string, unknown> {
  const url = `${publisher.url}/articles/${article.slug}`;
  const wordCount = estimateWordCount(article);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: article.title,
    description:
      article.summary ||
      article.title,
    image: article.imageUrl
      ? {
          '@type': 'ImageObject',
          url: article.imageUrl,
        }
      : undefined,
    datePublished: pickDate(article),
    dateModified:
      article.updatedAt || pickDate(article),
    author: {
      '@type': article.authorName === 'GOALZONE Team' || article.authorName === 'Redaksi'
        ? 'Organization'
        : 'Person',
      name: article.authorName || 'GOALZONE Team',
      url: publisher.url,
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: publisher.logo,
      },
    },
    articleSection: article.categoryName || 'Sepak Bola',
    wordCount,
    inLanguage: 'id-ID',
  };
}

/* ─────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────── */

interface GoogleNewsSchemaProps {
  article: NewsSchemaArticle | null;
  publisher?: PublisherConfig;
}

export default function GoogleNewsSchema({
  article,
  publisher = DEFAULT_PUBLISHER,
}: GoogleNewsSchemaProps) {
  useEffect(() => {
    if (!article) {
      // Remove stale schema when modal closes
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) existing.remove();
      return;
    }

    const jsonLd = buildJsonLd(article, publisher);
    const json = JSON.stringify(jsonLd, null, 0);

    // Re-use or create the <script> tag
    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.setAttribute('type', 'application/ld+json');
      document.head.appendChild(el);
    }
    el.textContent = json;

    return () => {
      // Clean up on unmount or article change
      const current = document.getElementById(SCRIPT_ID);
      if (current) current.remove();
    };
  }, [article, publisher]);

  // This component renders nothing visible
  return null;
}
