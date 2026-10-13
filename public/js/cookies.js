(function () {
  const banner = document.getElementById('cookie-banner');
  const manage = document.querySelector('[data-cookie-manage]');
  if (!banner) return;

  const YEAR = 60 * 60 * 24 * 365;
  const HALF_YEAR = 60 * 60 * 24 * 180;

  function readCookie(name) {
    const parts = document.cookie ? document.cookie.split('; ') : [];
    const found = parts.find((part) => part.startsWith(`${name}=`));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
  }

  function writeCookie(name, value, maxAge) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }

  function clearCookie(name) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  function choose(choice) {
    writeCookie('tb_consent', choice, HALF_YEAR);
    if (choice === 'all') {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      writeCookie('tb_theme', theme, YEAR);
    } else {
      clearCookie('tb_theme');
    }
    banner.hidden = true;
  }

  if (!readCookie('tb_consent')) banner.hidden = false;

  banner.querySelectorAll('[data-cookie-choice]').forEach((button) => {
    button.addEventListener('click', () => choose(button.getAttribute('data-cookie-choice')));
  });

  if (manage) {
    manage.addEventListener('click', () => {
      banner.hidden = false;
    });
  }
})();
