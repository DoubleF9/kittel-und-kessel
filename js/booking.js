// Kittel & Kessel – Workshop-Termine und Anmeldung (Frontend, DE/RO).
//
// Alles, was Daten lädt oder eine Anmeldung abschickt, läuft über `BookingApi`.
//   mode 'static' (heute): Termine aus js/courses-data.js, Anmeldung geht per FormSubmit
//                          als E-Mail an die Inhaberin, die sie von Hand bestätigt.
//   mode 'api'   (später): eigenes Backend unter /api – zählt Plätze verbindlich und leitet
//                          zur Zahlung (Stripe Checkout) weiter, wenn es eine checkoutUrl liefert.
// Plan und API-Vertrag: docs/inscriere-arhitectura.md
(() => {
  const LANG = document.documentElement.lang === 'ro' ? 'ro' : 'de';
  const LOCALE = LANG === 'ro' ? 'ro-RO' : 'de-DE';
  const TO = 'kontakt@kittelundkessel.de';

  // ---------------------------------------------------------------------------
  // Texte
  // ---------------------------------------------------------------------------
  const T = {
    de: {
      workshops: { archetypen: 'Archetypen im Dialog', symptomaufstellungen: 'Symptomaufstellungen' },
      timeSuffix: ' Uhr',
      register: 'Anmelden',
      full: 'Ausgebucht',
      closed: 'Anmeldung geschlossen',
      cancelled: 'Abgesagt',
      seatsFree: (n) => (n === 1 ? 'Noch 1 Platz frei' : `Noch ${n} Plätze frei`),
      seatsLabel: (b, m) => `${b} von ${m} Plätzen belegt`,
      takesPlace: 'Der Workshop findet statt.',
      minMissing: (k) => (k === 1
        ? 'Noch 1 Anmeldung, dann findet der Workshop statt.'
        : `Noch ${k} Anmeldungen, dann findet der Workshop statt.`),
      deadline: (d) => `Anmeldeschluss: ${d}`,
      priceOnRequest: 'Preis auf Anfrage',
      noDates: 'Aktuell sind keine Termine geplant. Schreib mir gern, wenn du über neue Termine informiert werden möchtest.',
      contact: 'Kontakt aufnehmen',
      loadError: 'Die Termine konnten gerade nicht geladen werden. Bitte versuch es später noch einmal oder schreib mir.',
      errName: 'Bitte gib deinen Namen ein.',
      errEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      errConsent: 'Bitte stimme der Verarbeitung deiner Angaben zu.',
      errFull: 'Dieser Termin ist inzwischen leider ausgebucht.',
      errGeneric: 'Die Anmeldung konnte nicht gesendet werden. Bitte versuch es noch einmal oder schreib mir eine E-Mail.',
      sending: 'Wird gesendet …',
      submit: 'Anmeldung absenden',
      done: {
        requested: 'Danke für deine Anmeldung! Ich prüfe sie und schicke dir eine Bestätigung per E-Mail.',
        confirmed: 'Danke! Deine Anmeldung ist bestätigt. Du erhältst gleich eine E-Mail mit allen Details.',
        pending: 'Danke! Dein Platz ist reserviert. Du wirst jetzt zur Zahlung weitergeleitet …',
        waitlist: 'Danke! Du stehst auf der Warteliste. Wird ein Platz frei, melde ich mich bei dir.',
      },
      returnSuccess: 'Vielen Dank, deine Zahlung ist eingegangen. Die Bestätigung kommt per E-Mail.',
      returnCancel: 'Die Zahlung wurde abgebrochen. Dein reservierter Platz wird nach kurzer Zeit wieder freigegeben.',
      mailSubject: 'Anmeldung',
    },
    ro: {
      workshops: { archetypen: 'Arhetipuri în dialog', symptomaufstellungen: 'Constelații ale simptomelor' },
      timeSuffix: '',
      register: 'Înscrie-te',
      full: 'Complet',
      closed: 'Înscrieri închise',
      cancelled: 'Anulat',
      seatsFree: (n) => (n === 1 ? 'Mai este 1 loc liber' : `Mai sunt ${n} locuri libere`),
      seatsLabel: (b, m) => `${b} din ${m} locuri ocupate`,
      takesPlace: 'Atelierul are loc.',
      minMissing: (k) => (k === 1
        ? 'Încă 1 înscriere și atelierul are loc.'
        : `Încă ${k} înscrieri și atelierul are loc.`),
      deadline: (d) => `Termen de înscriere: ${d}`,
      priceOnRequest: 'Preț la cerere',
      noDates: 'Momentan nu sunt programate date. Scrie-mi dacă vrei să fii anunțat(ă) despre date noi.',
      contact: 'Ia legătura cu mine',
      loadError: 'Datele nu au putut fi încărcate. Te rog să încerci mai târziu sau să-mi scrii.',
      errName: 'Te rog să îți introduci numele.',
      errEmail: 'Te rog să introduci o adresă de e-mail validă.',
      errConsent: 'Te rog să îți dai acordul pentru prelucrarea datelor.',
      errFull: 'Din păcate, între timp toate locurile pentru această dată au fost ocupate.',
      errGeneric: 'Înscrierea nu a putut fi trimisă. Te rog să încerci din nou sau să-mi scrii un e-mail.',
      sending: 'Se trimite …',
      submit: 'Trimite înscrierea',
      done: {
        requested: 'Îți mulțumesc pentru înscriere! O verific și îți trimit o confirmare prin e-mail.',
        confirmed: 'Mulțumesc! Înscrierea ta este confirmată. Vei primi imediat un e-mail cu toate detaliile.',
        pending: 'Mulțumesc! Locul tău este rezervat. Acum ești redirecționat(ă) către plată …',
        waitlist: 'Mulțumesc! Ești pe lista de așteptare. Dacă se eliberează un loc, te anunț.',
      },
      returnSuccess: 'Mulțumesc, plata a fost primită. Confirmarea vine prin e-mail.',
      returnCancel: 'Plata a fost anulată. Locul rezervat va fi eliberat în scurt timp.',
      mailSubject: 'Înscriere',
    },
  }[LANG];

  // ---------------------------------------------------------------------------
  // Datenzugriff – die einzige Stelle, die beim Umstieg auf das Backend ändert.
  // ---------------------------------------------------------------------------
  const BookingApi = {
    mode: 'static', // 'static' | 'api'
    baseUrl: '/api',

    /** @returns {Promise<Course[]>} – Felder wie in js/courses-data.js */
    async listCourses() {
      if (this.mode === 'api') {
        const res = await fetch(`${this.baseUrl}/courses`, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }
      return (window.KK_COURSES || []).slice();
    },

    /**
     * @param {Course} course
     * @param {{name:string,email:string,phone:string,message:string}} person
     * @returns {Promise<{status:'requested'|'confirmed'|'pending'|'waitlist', checkoutUrl?:string}>}
     * Fehler: err.code = 'full' (Termin voll) | 'send' (Versand fehlgeschlagen)
     */
    async register(course, person) {
      if (this.mode === 'api') {
        const res = await fetch(`${this.baseUrl}/registrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ courseId: course.id, lang: LANG, ...person }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) throw Object.assign(new Error('full'), { code: 'full' });
        if (!res.ok) throw Object.assign(new Error(data.message || res.status), { code: 'send' });
        return data;
      }

      // Statisch: Anmeldung per FormSubmit an die Inhaberin (sie bestätigt von Hand).
      const res = await fetch(`https://formsubmit.co/ajax/${TO}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Workshop: workshopTitle(course),
          Termin: formatWhen(course),
          'Termin-ID': course.id,
          Name: person.name,
          'E-Mail': person.email,
          Telefon: person.phone || '–',
          Nachricht: person.message || '–',
          Sprache: LANG.toUpperCase(),
          _subject: `Anmeldung (${LANG.toUpperCase()}): ${workshopTitle(course)} – ${formatDate(course.start)} – ${person.name}`,
          _replyto: person.email,
          _template: 'table',
          _captcha: 'false',
        }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (!res || !res.ok || String(data.success) !== 'true') {
        throw Object.assign(new Error('send'), { code: 'send' });
      }
      return { status: 'requested' };
    },
  };

  // ---------------------------------------------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parseLocal = (s) => { // 'YYYY-MM-DD' oder 'YYYY-MM-DDTHH:mm' als Ortszeit
    const [d, t = '00:00'] = s.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [h, min] = t.split(':').map(Number);
    return new Date(y, m - 1, day, h, min);
  };
  const fmt = (opts) => new Intl.DateTimeFormat(LOCALE, opts);
  const formatDate = (s) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(parseLocal(s));
  const formatTime = (s) => fmt({ hour: '2-digit', minute: '2-digit' }).format(parseLocal(s));
  const formatWhen = (c) => {
    const day = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseLocal(c.start));
    const time = c.end ? `${formatTime(c.start)}–${formatTime(c.end)}` : formatTime(c.start);
    return `${day} · ${time}${T.timeSuffix}`;
  };
  const formatPrice = (p) => (typeof p === 'number'
    ? new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: p % 1 ? 2 : 0 }).format(p)
    : T.priceOnRequest);
  const workshopTitle = (c) => T.workshops[c.workshop] || c.workshop;
  const localized = (v) => (v && typeof v === 'object' ? (v[LANG] || v.de || '') : (v || ''));

  /** Abgeleiteter Zustand eines Termins – dieselbe Regel gilt später im Backend. */
  function courseState(c, now = new Date()) {
    const free = Math.max(0, c.maxSeats - c.booked);
    const missing = Math.max(0, c.minSeats - c.booked);
    const deadline = parseLocal(c.registrationDeadline || c.start);
    if (c.registrationDeadline) deadline.setHours(23, 59, 59);
    let key = 'open';
    if (c.status === 'cancelled') key = 'cancelled';
    else if (free === 0) key = 'full';
    else if (now > deadline) key = 'closed';
    return { key, free, missing, takesPlace: c.status === 'confirmed' || missing === 0 };
  }

  // ---------------------------------------------------------------------------
  // Terminliste
  // ---------------------------------------------------------------------------
  function renderCourse(c) {
    const s = courseState(c);
    const start = parseLocal(c.start);
    const seats = Array.from({ length: c.maxSeats }, (_, i) =>
      `<span class="seats__dot${i < c.booked ? ' is-taken' : ''}${i === c.minSeats - 1 ? ' is-min' : ''}"></span>`).join('');

    let status = '';
    if (s.key === 'cancelled') status = `<p class="course__status course__status--muted">${esc(T.cancelled)}</p>`;
    else {
      const lines = [];
      if (s.key === 'open') lines.push(`<strong>${esc(T.seatsFree(s.free))}</strong>`);
      lines.push(s.takesPlace ? `<span class="course__ok">${esc(T.takesPlace)}</span>` : esc(T.minMissing(s.missing)));
      status = `<p class="course__status">${lines.join(' · ')}</p>`;
    }

    const action = s.key === 'open'
      ? `<button type="button" class="btn btn--solid course__btn" data-register="${esc(c.id)}">${esc(T.register)}</button>`
      : `<span class="course__badge">${esc(T[s.key])}</span>`;

    return `
      <article class="course${s.key !== 'open' ? ' is-inactive' : ''}">
        <div class="course__date" aria-hidden="true">
          <span class="course__day">${start.getDate()}</span>
          <span class="course__month">${esc(fmt({ month: 'short' }).format(start).replace('.', ''))} ${start.getFullYear()}</span>
        </div>
        <div class="course__body">
          <p class="course__when">${esc(formatWhen(c))}</p>
          <p class="course__meta">${esc(localized(c.location))} · ${esc(formatPrice(c.priceEur))}</p>
          <div class="seats" role="img" aria-label="${esc(T.seatsLabel(c.booked, c.maxSeats))}">${seats}</div>
          ${status}
          ${s.key === 'open' && c.registrationDeadline ? `<p class="course__deadline">${esc(T.deadline(formatDate(c.registrationDeadline)))}</p>` : ''}
        </div>
        <div class="course__action">${action}</div>
      </article>`;
  }

  async function renderLists() {
    const lists = document.querySelectorAll('[data-course-list]');
    if (!lists.length) return [];
    let courses;
    try {
      courses = await BookingApi.listCourses();
    } catch (err) {
      lists.forEach((el) => { el.innerHTML = `<p class="course-list__empty">${esc(T.loadError)}</p>`; });
      return [];
    }
    const now = new Date();
    const upcoming = courses
      .filter((c) => parseLocal(c.start) > now)
      .sort((a, b) => parseLocal(a.start) - parseLocal(b.start));

    lists.forEach((el) => {
      const mine = upcoming.filter((c) => c.workshop === el.dataset.courseList);
      el.innerHTML = mine.length
        ? mine.map(renderCourse).join('')
        : `<p class="course-list__empty">${esc(T.noDates)} <a href="kontakt.html">${esc(T.contact)}</a></p>`;
    });
    return upcoming;
  }

  // ---------------------------------------------------------------------------
  // Anmeldedialog
  // ---------------------------------------------------------------------------
  function setupDialog(getCourse) {
    const dialog = document.querySelector('.booking-dialog');
    if (!dialog) return;
    const form = dialog.querySelector('.booking-form');
    const summary = dialog.querySelector('[data-booking-summary]');
    const result = dialog.querySelector('[data-booking-result]');
    const button = form.querySelector('button[type="submit"]');
    const formError = form.querySelector('[data-error="form"]');
    const setError = (name, msg) => { form.querySelector(`[data-error="${name}"]`).textContent = msg; };
    let current = null;

    const open = (course) => {
      current = course;
      form.reset();
      form.hidden = false;
      result.hidden = true;
      button.disabled = false;
      button.textContent = T.submit;
      ['name', 'email', 'consent', 'form'].forEach((n) => setError(n, ''));
      summary.innerHTML = `<strong>${esc(workshopTitle(course))}</strong><br>${esc(formatWhen(course))}<br>${esc(localized(course.location))} · ${esc(formatPrice(course.priceEur))}`;
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      form.name.focus();
    };
    const close = () => { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); };

    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-register]');
      if (btn) { const c = getCourse(btn.dataset.register); if (c) open(c); }
      if (ev.target.closest('[data-booking-close]')) close();
    });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) close(); }); // Klick auf den Hintergrund

    const showResult = (status) => {
      form.hidden = true;
      result.hidden = false;
      result.querySelector('p').textContent = T.done[status] || T.done.requested;
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const person = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
      };
      let ok = true;
      setError('name', person.name ? '' : (ok = false, T.errName));
      setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) ? '' : (ok = false, T.errEmail));
      setError('consent', form.consent.checked ? '' : (ok = false, T.errConsent));
      setError('form', '');
      if (!ok) return;
      if (form.website.value) return; // Honeypot → Bot

      button.disabled = true;
      button.textContent = T.sending;
      try {
        const res = await BookingApi.register(current, person);
        showResult(res.status);
        if (res.checkoutUrl) window.location.href = res.checkoutUrl; // später: Stripe Checkout
      } catch (err) {
        if (err.code === 'send' && BookingApi.mode === 'static') {
          // FormSubmit noch nicht aktiviert / nicht erreichbar → E-Mail-Programm öffnen.
          const subject = encodeURIComponent(`${T.mailSubject}: ${workshopTitle(current)} – ${formatDate(current.start)}`);
          const body = encodeURIComponent(`${workshopTitle(current)}\n${formatWhen(current)}\n(${current.id})\n\n${person.name}\n${person.email}\n${person.phone}\n\n${person.message}`);
          window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
          showResult('requested');
          return;
        }
        formError.textContent = err.code === 'full' ? T.errFull : T.errGeneric;
        button.disabled = false;
        button.textContent = T.submit;
      }
    });
  }

  // Rückkehr von der Zahlungsseite (Stripe success_url / cancel_url): ?anmeldung=ok|abgebrochen
  function showReturnNotice() {
    const flag = new URLSearchParams(window.location.search).get('anmeldung');
    const box = document.querySelector('[data-booking-notice]');
    if (!flag || !box) return;
    box.textContent = flag === 'ok' ? T.returnSuccess : T.returnCancel;
    box.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    showReturnNotice();
    let courses = [];
    setupDialog((id) => courses.find((c) => c.id === id));
    courses = await renderLists();
  });
})();
