(function () {
  const root = document.documentElement;
  const key = 'tb-theme';

  function current() {
    return root.getAttribute('data-theme') || 'light';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(key, theme);
    } catch (e) {
      /* private mode — theme still works for this page load */
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const next = theme === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', `Switch to ${next} mode`);
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      apply(current() === 'dark' ? 'light' : 'dark');
    });
  });

  apply(current());
})();
