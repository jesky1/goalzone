const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goalzone-seven.vercel.app';

/**
 * Props for GoogleNewsSchema component.
 * All required fields must be provided for Google News / Discover compliance.
 */
interface GoogleNewsSchemaProps {
  /** Article headline / title */
  headline: string;
  /** URL of the article's hero image (min 696px wide for Google Discover) */
  image: string;
  /** ISO 8601 date when the article was first published */
  datePublished: string;
  /** ISO 8601 date when the article was last modified */
  dateModified?: string;
  /** Author information */
  author: {
    name: string;
    url?: string;
  };
  /** Short description / summary of the article */
  description?: string;
  /** Article section / category (e.g. "Transfer", "Premier League") */
  articleSection?: string;
  /** Full canonical URL of the article page */
  url?: string;
  /** Approximate word count of the article body */
  wordCount?: number;
  /** Whether the article is accessible for free */
  isAccessibleForFree?: boolean;
  /** Language of the article (default: "id") */
  inLanguage?: string;
}

/**
 * Generates a Google News & Discover compliant JSON-LD NewsArticle schema.
 *
 * Required by Google:
 * - headline, image, datePublished, author (with name), publisher (with name + logo)
 *
 * Recommended for Discover:
 * - Large image (≥696px), dateModified, articleSection, description, isAccessibleForFree
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/article
 * @see https://developers.google.com/search/docs/appearance/google-news
 */
export default function GoogleNewsSchema({
  headline,
  image,
  datePublished,
  dateModified,
  author,
  description,
  articleSection,
  url,
  wordCount,
  isAccessibleForFree = true,
  inLanguage = 'id',
}: GoogleNewsSchemaProps) {
  const articleUrl = url || SITE_URL;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description: description || headline,
    image: {
      '@type': 'ImageObject',
      url: image,
    },
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': author.url ? 'Person' : 'Organization',
      name: author.name,
      ...(author.url ? { url: author.url } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'GOALZONE',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    url: articleUrl,
    articleSection: articleSection || 'Sepak Bola',
    inLanguage,
    isAccessibleForFree,
    ...(wordCount ? { wordCount } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
