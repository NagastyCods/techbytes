(function () {
  const root = document.documentElement;
  const key = 'tb-theme';

  function current() {
    return root.getAttribute('data-theme') || 'light';
  }

  function readCookie(name) {
    const parts = document.cookie ? document.cookie.split('; ') : [];
    const found = parts.find((part) => part.startsWith(`${name}=`));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(key, theme);
    } catch (e) {
      /* private mode — theme still works for this page load */
    }
    if (readCookie('tb_consent') === 'all') {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `tb_theme=${encodeURIComponent(theme)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
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
