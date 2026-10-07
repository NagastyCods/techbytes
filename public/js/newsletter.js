(function () {
  document.querySelectorAll('[data-newsletter-form]').forEach((form) => {
    const status = form.parentElement.querySelector('[data-newsletter-status]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = new URLSearchParams(new FormData(form));
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body
        });
        const data = await res.json();
        if (status) {
          status.hidden = false;
          status.textContent = data.message || 'Thanks.';
          status.classList.toggle('is-ok', data.status === 'ok');
          status.classList.toggle('is-error', data.status === 'invalid' || !data.ok);
        }
        if (data.status === 'ok') form.reset();
      } catch (err) {
        if (status) {
          status.hidden = false;
          status.textContent = 'Could not subscribe right now. Try again.';
          status.classList.add('is-error');
        }
      }
    });
  });
})();
