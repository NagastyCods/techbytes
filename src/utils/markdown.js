const sanitizeHtml = require('sanitize-html');
const slugify = require('slugify');

const sanitizeOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'h1',
    'h2',
    'h3',
    'h4',
    'figure',
    'figcaption'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    '*': ['id', 'class']
  },
  allowedSchemes: ['http', 'https', 'mailto']
};

function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, '').trim();
}

/**
 * Marked v18 is ESM-only, so we import() it instead of require().
 * Controllers already use async functions, so awaiting this is natural.
 */
async function renderArticleHtml(markdown) {
  const { marked } = await import('marked');
  const raw = marked.parse(markdown || '', { gfm: true, breaks: false });
  const clean = sanitizeHtml(raw, sanitizeOptions);
  const used = new Map();

  const html = clean.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (match, level, inner) => {
    const text = stripTags(inner);
    let id = slugify(text, { lower: true, strict: true }) || `section-${used.size + 1}`;
    const count = used.get(id) || 0;
    used.set(id, count + 1);
    if (count) id = `${id}-${count + 1}`;
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  return html;
}

function extractToc(html) {
  const items = [];
  const pattern = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/gi;
  let match = pattern.exec(html);
  while (match) {
    items.push({
      level: Number(match[1]),
      id: match[2],
      text: stripTags(match[3])
    });
    match = pattern.exec(html);
  }
  return items;
}

module.exports = { renderArticleHtml, extractToc };
