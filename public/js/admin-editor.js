(function () {
  const form = document.querySelector('[data-editor-form]');
  if (!form) return;

  const markdown = form.querySelector('[data-markdown]');
  const preview = form.querySelector('[data-preview]');
  const slugSource = form.querySelector('[data-slug-source]');
  const slugTarget = form.querySelector('[data-slug-target]');
  const status = form.querySelector('[data-status]');
  const schedule = form.querySelector('[data-schedule]');
  let slugTouched = Boolean(slugTarget && slugTarget.value);
  let timer;

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  if (slugTarget) {
    slugTarget.addEventListener('input', () => { slugTouched = true; });
  }
  if (slugSource && slugTarget && !slugTouched) {
    slugSource.addEventListener('input', () => {
      if (!slugTouched) slugTarget.value = slugify(slugSource.value);
    });
  }

  async function refreshPreview() {
    if (!markdown || !preview) return;
    try {
      const res = await fetch('/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ markdown: markdown.value })
      });
      const data = await res.json();
      preview.innerHTML = data.html || '<p class="muted">Nothing to preview yet.</p>';
    } catch (e) {
      preview.innerHTML = '<p class="muted">Preview failed. Save still works.</p>';
    }
  }

  if (markdown) {
    markdown.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refreshPreview, 280);
    });
    refreshPreview();
  }

  async function uploadFile(file) {
    const body = new FormData();
    body.append('image', file);
    const res = await fetch('/admin/uploads', { method: 'POST', body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  const inline = form.querySelector('[data-inline-upload]');
  if (inline) {
    inline.addEventListener('change', async () => {
      const file = inline.files[0];
      if (!file) return;
      try {
        const url = await uploadFile(file);
        const snippet = `\n![${file.name}](${url})\n`;
        const start = markdown.selectionStart;
        markdown.value = markdown.value.slice(0, start) + snippet + markdown.value.slice(markdown.selectionEnd);
        refreshPreview();
      } catch (e) {
        window.alert(e.message);
      }
      inline.value = '';
    });
  }

  const cover = form.querySelector('[data-cover-upload]');
  const coverInput = form.querySelector('#coverImage');
  if (cover && coverInput) {
    cover.addEventListener('change', async () => {
      const file = cover.files[0];
      if (!file) return;
      try {
        coverInput.value = await uploadFile(file);
      } catch (e) {
        window.alert(e.message);
      }
      cover.value = '';
    });
  }

  if (status && schedule) {
    const sync = () => {
      schedule.required = status.value === 'scheduled';
    };
    status.addEventListener('change', sync);
    sync();
  }
})();
