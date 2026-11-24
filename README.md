# Kittel & Kessel – Website

Static website (HTML, CSS, a little JS). No build step: open `index.html` or serve the folder.

- `css/styles.css` – all styles; colours and fonts are variables at the top
- `js/main.js` – mobile menu, scroll fade-in, contact form (texts in German and Romanian)
- `js/booking.js` – workshop dates, free seats and registration form (`workshops.html`)
- `js/courses-data.js` – the workshop dates, maintained by hand for now
- `fonts/`, `images/` – self-hosted fonts and logo

## Languages (DE / RO)
- German pages live in the root, Romanian translations in `ro/` with the **same file names**
  (e.g. `kontakt.html` ↔ `ro/kontakt.html`).
- The **DE | RO** switcher in the header of every page links to the same page in the other language.
- When you change text on a German page, update the matching page in `ro/` too.
- The Romanian Impressum and Datenschutz are marked as informative translations; the German
  versions remain the legally binding ones.

## Workshop registration (max. 6 seats, takes place from 4)
Frontend only for now: dates come from `js/courses-data.js`, registrations are e-mailed via
FormSubmit and confirmed by hand (then raise `booked` in the data file).
Plan for the backend and Stripe payments, including the API contract the frontend already
expects: [`docs/inscriere-arhitectura.md`](docs/inscriere-arhitectura.md).

## Contact form
Sent via [FormSubmit](https://formsubmit.co) to `kontakt@kittelundkessel.de` (see `TO` in `js/main.js`).
The first submission sends a one-time activation e-mail to that address; until the link in it
is clicked, the form falls back to opening the visitor's e-mail program.

## Before going live
- `js/courses-data.js`: replace the **example dates** with the real ones (and prices).
- `datenschutz.html` and `ro/datenschutz.html`: fill in the `[…]` hosting placeholders and the form
  provider's address; mention the registration form in section 3.
