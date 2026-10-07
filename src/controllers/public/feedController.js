const { Post, Category, Tag, User } = require('../../models');
const env = require('../../config/env');
const { publishedQuery } = require('../../utils/queries');
const { escapeXml, rfc822, isoDay } = require('../../utils/xml');
const { absoluteUrl } = require('../../utils/urls');

async function rss(req, res, next) {
  try {
    const posts = await Post.find(publishedQuery())
      .sort({ publishedAt: -1 })
      .limit(50)
      .populate('author category')
      .lean();

    const items = posts
      .map((post) => {
        const link = absoluteUrl(`/article/${post.slug}`);
        return [
          '<item>',
          `<title>${escapeXml(post.title)}</title>`,
          `<link>${escapeXml(link)}</link>`,
          `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
          `<pubDate>${rfc822(post.publishedAt)}</pubDate>`,
          post.category ? `<category>${escapeXml(post.category.name)}</category>` : '',
          `<description><![CDATA[${post.excerpt || ''}]]></description>`,
          '</item>'
        ].join('');
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(env.siteName)}</title>
    <link>${escapeXml(env.siteUrl)}</link>
    <description>${escapeXml(env.siteTagline)}</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(`${env.siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    next(err);
  }
}

function urlEntry(loc, lastmod, changefreq = 'weekly') {
  return `<url><loc>${escapeXml(loc)}</loc><lastmod>${isoDay(lastmod)}</lastmod><changefreq>${changefreq}</changefreq></url>`;
}

async function sitemap(req, res, next) {
  try {
    const [posts, categories, tags, authors] = await Promise.all([
      Post.find(publishedQuery()).select('slug updatedAt publishedAt').lean(),
      Category.find().select('slug updatedAt').lean(),
      Tag.find().select('slug updatedAt').lean(),
      User.find({ isActive: true }).select('slug updatedAt').lean()
    ]);

    const latest = posts.reduce((max, post) => {
      const t = new Date(post.publishedAt || post.updatedAt).getTime();
      return t > max ? t : max;
    }, Date.now());

    const urls = [
      urlEntry(env.siteUrl, latest, 'hourly'),
      urlEntry(`${env.siteUrl}/search`, new Date(), 'daily'),
      ...categories.map((c) => urlEntry(`${env.siteUrl}/category/${c.slug}`, c.updatedAt, 'daily')),
      ...tags.map((t) => urlEntry(`${env.siteUrl}/tag/${t.slug}`, t.updatedAt, 'weekly')),
      ...authors.map((a) => urlEntry(`${env.siteUrl}/authors/${a.slug}`, a.updatedAt, 'weekly')),
      ...posts.map((p) => urlEntry(`${env.siteUrl}/article/${p.slug}`, p.updatedAt || p.publishedAt, 'weekly'))
    ].join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    next(err);
  }
}

function robots(req, res) {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    `Sitemap: ${env.siteUrl}/sitemap.xml`
  ].join('\n');
  res.type('text/plain').send(body);
}

module.exports = { rss, sitemap, robots };
