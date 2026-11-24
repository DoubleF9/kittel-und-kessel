// Kittel & Kessel – small site script: mobile menu, scroll reveal, contact form.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  // ----- Mobile menu -----
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.site-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  // ----- Scroll reveal -----
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('is-visible'));
  }

  // ----- Contact form -----
  // Messages are sent through FormSubmit (formsubmit.co), which forwards them to TO.
  // The very first submission triggers a one-time activation e-mail to TO; until
  // that link is clicked (or if the service is unreachable) the form falls back to
  // opening the visitor's e-mail program with the message prefilled.
  const form = document.querySelector('.form');
  if (form) {
    const TO = 'kontakt@kittelundkessel.de';
    const ENDPOINT = `https://formsubmit.co/ajax/${TO}`;
    const setError = (name, msg) => { form.querySelector(`[data-error="${name}"]`).textContent = msg; };
    const button = form.querySelector('button[type="submit"]');
    // Texts in the page language (<html lang="de"> or <html lang="ro">).
    const T = {
      de: {
        success: 'Vielen Dank für deine Nachricht. Ich melde mich bald bei dir.',
        subject: 'Anfrage über die Website',
        name: 'Bitte gib deinen Namen ein.',
        email: 'Bitte gib eine gültige E-Mail-Adresse ein.',
        message: 'Bitte schreib eine Nachricht.',
        consent: 'Bitte stimme der Verarbeitung deiner Angaben zu.',
        sending: 'Wird gesendet …',
      },
      ro: {
        success: 'Îți mulțumesc pentru mesaj. Îți voi răspunde în curând.',
        subject: 'Solicitare prin site',
        name: 'Te rog să îți introduci numele.',
        email: 'Te rog să introduci o adresă de e-mail validă.',
        message: 'Te rog să scrii un mesaj.',
        consent: 'Te rog să îți dai acordul pentru prelucrarea datelor.',
        sending: 'Se trimite …',
      },
    }[document.documentElement.lang === 'ro' ? 'ro' : 'de'];

    const showSuccess = () => {
      const done = document.createElement('p');
      done.className = 'form__success';
      done.textContent = T.success;
      form.replaceWith(done);
    };

    const openMailProgram = (name, email, message) => {
      const subject = encodeURIComponent(`${T.subject} – ${name}`);
      const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
      window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const consent = form.consent.checked;

      let ok = true;
      setError('name', name ? '' : (ok = false, T.name));
      setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : (ok = false, T.email));
      setError('message', message ? '' : (ok = false, T.message));
      setError('consent', consent ? '' : (ok = false, T.consent));
      if (!ok) return;
      if (form.website.value) return; // honeypot filled → bot

      button.disabled = true;
      button.textContent = T.sending;
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: `${T.subject} – ${name}`,
            _replyto: email,
            _template: 'table',
            _captcha: 'false',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || res.status);
      } catch (err) {
        // Not activated yet / service down: hand the message to the e-mail program instead.
        openMailProgram(name, email, message);
      }
      showSuccess();
    });
  }
});
