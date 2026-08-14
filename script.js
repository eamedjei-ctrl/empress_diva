document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.intro-overlay');
  if (overlay) {
    window.setTimeout(() => {
      overlay.classList.add('hidden');
    }, 5000);
  }

  const navMenu = document.querySelector('.nav-menu');
  const toggleButton = document.querySelector('.mobile-toggle');

  if (toggleButton && navMenu) {
    toggleButton.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  const sizePills = document.querySelectorAll('.size-pill');
  sizePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
    });
  });

  const pageForms = document.querySelectorAll('form[data-form="contact"]');
  pageForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || 'Send Message';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Message Sent';
      }

      setTimeout(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
        form.reset();
      }, 1800);
    });
  });
});
