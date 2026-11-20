# Kittel & Kessel – Website

Static website (HTML, CSS, a little JS). No build step: open `index.html` or serve the folder.

- `css/styles.css` – all styles; colours and fonts are variables at the top
- `js/main.js` – mobile menu, scroll fade-in, contact form
- `fonts/`, `images/` – self-hosted fonts and logo

## Contact form
Sent via [FormSubmit](https://formsubmit.co) to `kontakt@kittelundkessel.de` (see `TO` in `js/main.js`).
The first submission sends a one-time activation e-mail to that address; until the link in it
is clicked, the form falls back to opening the visitor's e-mail program.

## Before going live
- `datenschutz.html`: fill in the `[…]` hosting placeholders and the form provider's address.
- `workshops.html` is linked from the menu but does not exist yet.
