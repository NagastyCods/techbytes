(function () {
  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, ms) {
    let timer;
    return function debounced() {
      const args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(null, args), ms);
    };
  }

  function skeletonGrid() {
    return '<div class="card-grid" aria-hidden="true">'
      + '<div class="skeleton skeleton-card"></div>'.repeat(3)
      + '</div>';
  }

  function card(post) {
    const img = post.coverImage
      ? `<img src="${esc(post.coverImage)}" alt="" loading="lazy" width="800" height="500">`
      : '<div class="card-fallback" aria-hidden="true"></div>';
    const cat = post.category
      ? `<a class="kicker" href="${esc(post.category.href)}">${esc(post.category.name)}</a>`
      : '';
    const author = post.author
      ? `<a href="${esc(post.author.href)}">${esc(post.author.name)}</a><span aria-hidden="true"> · </span>`
      : '';
    return `<article class="card">
      <a class="card-media" href="${esc(post.href)}">${img}</a>
      <div class="card-body">
        ${cat}
        <h3 class="card-title"><a href="${esc(post.href)}">${esc(post.title)}</a></h3>
        ${post.excerpt ? `<p class="card-excerpt">${esc(post.excerpt)}</p>` : ''}
        <p class="meta">${author}<time datetime="${esc(post.publishedAt)}">${esc(post.publishedLabel)}</time>
          <span aria-hidden="true"> · </span>${esc(post.readTimeMinutes)} min read</p>
      </div>
    </article>`;
  }

  async function fetchSearch(params, limit) {
    const url = new URL('/api/search', window.location.origin);
    Object.keys(params).forEach((key) => {
      if (params[key]) url.searchParams.set(key, params[key]);
    });
    if (limit) url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  }

  function bindHeader() {
    const form = document.querySelector('[data-live-search="header"]');
    const panel = document.getElementById('header-search-results');
    if (!form || !panel) return;
    const input = form.querySelector('input[name="q"]');
    let controller;

    function hide() {
      panel.hidden = true;
      panel.innerHTML = '';
    }

    const run = debounce(async () => {
      const q = input.value.trim();
      if (q.length < 2) {
        hide();
        return;
      }
      if (controller) controller.abort();
      controller = new AbortController();
      panel.hidden = false;
      panel.innerHTML = '<p class="live-empty">Searching…</p>';
      try {
        const data = await fetchSearch({ q }, 6);
        if (!data.posts.length) {
          panel.innerHTML = `<p class="live-empty">No matches for “${esc(q)}”.</p>`;
          return;
        }
        panel.innerHTML = data.posts.map((post) => `
          <a role="option" href="${esc(post.href)}">
            <span class="live-kicker">${esc(post.category ? post.category.name : 'Story')}</span>
            ${esc(post.title)}
          </a>
        `).join('') + `<a class="live-more" href="/search?q=${encodeURIComponent(q)}">View all ${data.total} results</a>`;
      } catch (err) {
        if (err.name === 'AbortError') return;
        panel.innerHTML = '<p class="live-empty">Search is unavailable right now.</p>';
      }
    }, 280);

    input.addEventListener('input', run);
    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) run();
    });
    document.addEventListener('click', (event) => {
      if (!form.contains(event.target) && !panel.contains(event.target)) hide();
    });
    form.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hide();
    });
  }

  function bindPage() {
    const form = document.querySelector('[data-live-search="page"]');
    const results = document.querySelector('[data-search-results]');
    const count = document.querySelector('[data-search-count]');
    if (!form || !results) return;

    const run = debounce(async () => {
      const params = {
        q: form.q.value.trim(),
        category: form.category.value,
        from: form.from.value,
        to: form.to.value
      };
      const intent = params.q.length >= 2 || params.category || params.from || params.to;
      if (!intent) {
        if (count) count.hidden = true;
        results.innerHTML = '';
        const url = new URL('/search', window.location.origin);
        window.history.replaceState({}, '', url);
        return;
      }

      results.innerHTML = skeletonGrid();
      try {
        const data = await fetchSearch(params, 9);
        const url = new URL('/search', window.location.origin);
        Object.keys(params).forEach((key) => {
          if (params[key]) url.searchParams.set(key, params[key]);
        });
        window.history.replaceState({}, '', url);

        if (count) {
          count.hidden = false;
          const qBit = params.q ? ` for “${params.q}”` : '';
          count.textContent = `${data.total} result${data.total === 1 ? '' : 's'}${qBit}`;
        }

        if (!data.posts.length) {
          results.innerHTML = '<p class="empty">No published stories matched those filters.</p>';
          return;
        }
        results.innerHTML = `<div class="card-grid">${data.posts.map(card).join('')}</div>`;
      } catch (err) {
        results.innerHTML = '<p class="empty">Live search failed. Use the Search button instead.</p>';
      }
    }, 280);

    form.addEventListener('input', run);
    form.addEventListener('change', run);
  }

  bindHeader();
  bindPage();
})();
