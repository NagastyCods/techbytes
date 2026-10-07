const { Post } = require('../models');
const { publishedQuery } = require('./queries');
const { formatDate, isoDate } = require('./dates');
const { getPagination, buildPager } = require('./pagination');
const mongoose = require('mongoose');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseFilters(query) {
  const q = String(query.q || '').trim();
  const category = String(query.category || '').trim();
  const from = String(query.from || '').trim();
  const to = String(query.to || '').trim();
  return { q, category, from, to };
}

function hasSearchIntent({ q, category, from, to }) {
  return q.length >= 2 || Boolean(category) || Boolean(from) || Boolean(to);
}

function applyDateAndCategory(filter, { category, from, to }) {
  if (category && mongoose.Types.ObjectId.isValid(category)) {
    filter.category = category;
  }
  if (from || to) {
    filter.publishedAt = { ...(filter.publishedAt || {}) };
    if (from) filter.publishedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.publishedAt.$lte = end;
    }
  }
  return filter;
}

function toCard(post) {
  return {
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    readTimeMinutes: post.readTimeMinutes,
    publishedAt: isoDate(post.publishedAt),
    publishedLabel: formatDate(post.publishedAt),
    href: `/article/${post.slug}`,
    category: post.category
      ? { name: post.category.name, slug: post.category.slug, href: `/category/${post.category.slug}` }
      : null,
    author: post.author
      ? { name: post.author.name, slug: post.author.slug, href: `/authors/${post.author.slug}` }
      : null
  };
}

/**
 * Shared by the HTML /search page and GET /api/search.
 * Text index first; regex fallback when Mongo rejects $text (short/stopword queries).
 */
async function searchPosts(query, { limit = 9 } = {}) {
  const filters = parseFilters(query);
  const { page, limit: pageSize, skip } = getPagination(query, { limit });
  const empty = { ...filters, posts: [], total: 0, page, limit: pageSize, pager: null, ran: false };

  if (!hasSearchIntent(filters)) {
    return empty;
  }

  const base = applyDateAndCategory(publishedQuery(), filters);
  let posts = [];
  let total = 0;

  async function byRegex() {
    const filter = { ...base };
    if (filters.q.length >= 2) {
      const rx = new RegExp(escapeRegex(filters.q), 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }];
    }
    const [docs, count] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('author category')
        .lean(),
      Post.countDocuments(filter)
    ]);
    return { docs, count };
  }

  if (filters.q.length >= 2) {
    try {
      const textFilter = { ...base, $text: { $search: filters.q } };
      const [docs, count] = await Promise.all([
        Post.find(textFilter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .populate('author category')
          .lean(),
        Post.countDocuments(textFilter)
      ]);
      posts = docs;
      total = count;
    } catch (err) {
      const fallback = await byRegex();
      posts = fallback.docs;
      total = fallback.count;
    }
  } else {
    const fallback = await byRegex();
    posts = fallback.docs;
    total = fallback.count;
  }

  const qs = new URLSearchParams();
  if (filters.q) qs.set('q', filters.q);
  if (filters.category) qs.set('category', filters.category);
  if (filters.from) qs.set('from', filters.from);
  if (filters.to) qs.set('to', filters.to);
  const path = `/search?${qs.toString()}`;

  return {
    ...filters,
    posts,
    cards: posts.map(toCard),
    total,
    page,
    limit: pageSize,
    ran: true,
    pager: buildPager({ page, limit: pageSize, total, path })
  };
}

module.exports = { searchPosts, parseFilters, hasSearchIntent };
