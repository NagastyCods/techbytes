const env = require('../config/env');
const { absoluteUrl } = require('./urls');

function organizationLd() {
  return {
    '@type': 'NewsMediaOrganization',
    name: env.siteName,
    url: env.siteUrl,
    description: env.siteTagline
  };
}

function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationLd(),
      {
        '@type': 'WebSite',
        name: env.siteName,
        url: env.siteUrl,
        description: env.siteTagline,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${env.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
}

function articleLd(post) {
  const url = absoluteUrl(`/article/${post.slug}`);
  const image = absoluteUrl(post.seo?.ogImage || post.coverImage);
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: image ? [image] : [],
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: absoluteUrl(`/authors/${post.author.slug}`)
    },
    publisher: organizationLd(),
    articleSection: post.category ? post.category.name : undefined
  };
}

module.exports = { organizationLd, websiteLd, articleLd };
