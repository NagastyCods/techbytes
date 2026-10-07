(function () {
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('[data-nav-toggle]');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const copyBtn = document.querySelector('[data-copy-link]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy link'; }, 1600);
      } catch (e) {
        copyBtn.textContent = 'Copy failed';
      }
    });
  }

  const tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach((link) => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const el = document.getElementById(id);
      if (el) map.set(el, link);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          tocLinks.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, el) => observer.observe(el));
  }
})();
