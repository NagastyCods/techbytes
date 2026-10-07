(function () {
  const form = document.querySelector('[data-comment-form]');
  if (!form) return;
  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
    }
  });
})();
