const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goalzone-seven.vercel.app';

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GOALZONE',
    url: SITE_URL,
    description: 'Portal berita sepak bola terkini dengan liputan lengkap liga-liga top dunia. Live score, klasemen, transfer, dan analisis taktis.',
    publisher: {
      '@type': 'Organization',
      name: 'GOALZONE',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GOALZONE',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.svg`,
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Indonesian', 'English'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface NewsArticleJsonLdProps {
  article: {
    title: string;
    summary: string | null;
    imageUrl: string | null;
    createdAt: string;
    author: { username: string };
    category: { name: string };
  };
}

export function NewsArticleJsonLd({ article }: NewsArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary || '',
    image: article.imageUrl || `${SITE_URL}/logo.svg`,
    datePublished: article.createdAt,
    dateModified: article.createdAt,
    author: {
      '@type': 'Person',
      name: article.author.username,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GOALZONE',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    articleSection: article.category.name,
    inLanguage: 'id',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
