const slugify = require('slugify');

function baseSlug(value, fallback = 'item') {
  return slugify(String(value || ''), { lower: true, strict: true }) || fallback;
}

/** If "ai" is taken, try "ai-2", "ai-3", … */
async function uniqueSlug(Model, value, { fallback = 'item', excludeId } = {}) {
  const root = baseSlug(value, fallback);
  let candidate = root;
  let n = 1;
  const exists = async (slug) => {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    return Model.exists(query);
  };
  while (await exists(candidate)) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

module.exports = { baseSlug, uniqueSlug };
