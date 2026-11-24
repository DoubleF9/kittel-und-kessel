# Înscrieri la ateliere: arhitectură și pașii următori

Reguli: **maximum 6 locuri** pe dată, atelierul **are loc de la 4 participanți**.
Plata prin **Stripe** se adaugă mai târziu.

## Ce există acum (doar frontend)

| Fișier | Rol |
|---|---|
| `workshops.html`, `ro/workshops.html` | Pagina cu ateliere, date, locuri libere și formularul de înscriere (dialog) |
| `js/courses-data.js` | **Sursa de date provizorie**: lista datelor, întreținută de mână |
| `js/booking.js` | Afișarea datelor, regulile de stare, formularul. Tot accesul la date trece prin obiectul `BookingApi` |
| `css/styles.css` | Secțiunea „Workshops: Termine & Anmeldung” |

**Cum funcționează acum (`BookingApi.mode = 'static'`):**
1. Datele vin din `js/courses-data.js`. Câmpul `booked` (locuri ocupate) se actualizează **manual**.
2. Înscrierea se trimite prin FormSubmit ca e-mail către `kontakt@kittelundkessel.de`
   (subiect: `Anmeldung (DE|RO): <atelier> – <dată> – <nume>`).
   Dacă FormSubmit nu e activat sau nu răspunde, se deschide programul de e-mail al vizitatorului.
3. Oana confirmă manual prin e-mail și mărește `booked` în fișier.

Limitare cunoscută: în modul static locurile **nu sunt rezervate automat**. Doi oameni se pot
înscrie pe ultimul loc; Oana decide manual. De aceea e nevoie de backend.

### Sarcini înainte de lansare (și fără backend)
- Înlocuiește **datele de exemplu** din `js/courses-data.js` cu cele reale (inclusiv prețuri).
- `datenschutz.html` + `ro/datenschutz.html`: menționează formularul de înscriere la secțiunea 3
  (aceleași date ca la contact, trimise prin FormSubmit).
- AGB / condiții de participare: anulare, regula de minim 4 participanți, termenul de decizie.
  Dreptul de retragere (Widerrufsrecht) pentru ateliere online vs. cu prezență fizică trebuie
  verificat juridic.

## Ținta: backend mic + Stripe

```
Browser (workshops.html)
   │  GET  /api/courses
   │  POST /api/registrations
   ▼
Funcții serverless ──► Bază de date în UE (courses, registrations)
   │                        ▲
   ├──► Stripe Checkout ────┘ webhook checkout.session.completed / expired
   └──► E-mailuri (participant + Oana)
   ▲
   └── job zilnic (cron): expirări + decizia „are loc / se anulează”
```

Propunere de găzduire: Netlify (site + funcții) + Supabase (Postgres, regiunea Frankfurt),
sau Cloudflare Pages + Workers + D1. Important: un singur furnizor de găzduire, cu date în UE.
Furnizorul ales completează și placeholder-ul de hosting din Datenschutz.

### Trecerea frontendului pe backend
În `js/booking.js` se schimbă **o singură linie**: `mode: 'static'` → `mode: 'api'`.
Apoi `js/courses-data.js` și tag-ul `<script>` corespunzător se pot șterge din cele două pagini workshops.

## Contractul API (pe care frontendul îl așteaptă deja)

### `GET /api/courses`
Răspuns: listă de obiecte cu **aceleași câmpuri ca în `js/courses-data.js`**:
```json
[{
  "id": "archetypen-2027-01-23",
  "workshop": "archetypen",
  "start": "2027-01-23T10:00",
  "end": "2027-01-23T16:00",
  "location": { "de": "Online (Zoom)", "ro": "Online (Zoom)" },
  "priceEur": 120,
  "maxSeats": 6,
  "minSeats": 4,
  "booked": 2,
  "registrationDeadline": "2027-01-16",
  "status": "open"
}]
```
`booked` = înscrieri `confirmed` + înscrieri `pending` încă neexpirate (locuri ținute pentru plată).
Fără date personale în acest răspuns.

### `POST /api/registrations`
Corp: `{ courseId, name, email, phone, message, lang }`

| Răspuns | Când | Ce face frontendul |
|---|---|---|
| `200 { "status": "confirmed" }` | fără plată online (ca acum, dar automat) | mesaj „înscriere confirmată” |
| `200 { "status": "pending", "checkoutUrl": "https://checkout.stripe.com/..." }` | cu Stripe | redirecționează la plată |
| `200 { "status": "waitlist" }` | opțional, dacă se introduce listă de așteptare | mesaj „listă de așteptare” |
| `409` | nu mai sunt locuri | mesaj „complet” |
| alt cod | eroare | mesaj de eroare generic |

Întoarcerea de la Stripe: `success_url = .../workshops.html?anmeldung=ok`,
`cancel_url = .../workshops.html?anmeldung=abgebrochen` (pentru `ro/workshops.html` la fel).
Frontendul afișează deja mesajul potrivit pentru ambii parametri.

## Modelul de date

**courses**: `id`, `workshop`, `start`, `end`, `location_de`, `location_ro`, `price_eur`,
`max_seats` (6), `min_seats` (4), `registration_deadline`, `status` (`open` | `confirmed` | `cancelled`).

**registrations**: `id`, `course_id`, `name`, `email`, `phone`, `message`, `lang`,
`status` (`pending` | `confirmed` | `cancelled` | `refunded`), `created_at`,
`expires_at` (pentru `pending`), `stripe_session_id`, `stripe_payment_intent`.

Fără date de sănătate. Ștergerea datelor după atelier, conform Datenschutz.

## Reguli de business (backend)

1. **Locuri, fără supra-rezervare:** în aceeași tranzacție (cu blocarea rândului cursului):
   `confirmed + pending neexpirate < max_seats`, altfel `409`.
2. **Fără Stripe:** înscrierea devine direct `confirmed`; plata se face manual, prin factură.
3. **Cu Stripe:** înscrierea devine `pending` cu `expires_at = acum + 30 min`; se creează
   o sesiune Stripe Checkout (`expires_at` identic) și se trimite `checkoutUrl`.
   Webhook-ul `checkout.session.completed` → `confirmed` + e-mail.
   Webhook-ul `checkout.session.expired` sau un job → `cancelled`, locul se eliberează.
   Webhook-urile trebuie verificate cu semnătura Stripe și să fie idempotente.
4. **Minimum 4 participanți:** un job zilnic verifică, la `registration_deadline`:
   - ≥ 4 `confirmed` → curs `confirmed`, e-mail „atelierul are loc” către toți;
   - < 4 → curs `cancelled`, e-mail către toți și **rambursare automată** prin Stripe Refund.
5. **Momentul plății:** plată imediată + rambursare la anulare. *Nu* folosim „autorizare acum,
   încasare mai târziu” (manual capture): Stripe ține autorizarea doar ~7 zile, iar datele
   sunt anunțate de obicei cu săptămâni înainte.
6. **Administrare:** la început e-mail către Oana la fiecare înscriere + tabelul din baza de date;
   mai târziu o pagină de admin protejată (lista înscrierilor, anulare manuală).

Regula de afișare (locuri libere, „are loc”, „complet”, „înscrieri închise”) există deja în
`courseState()` din `js/booking.js`; backendul trebuie să folosească aceeași logică.

## Decizii încă deschise
- Găzduirea (Netlify + Supabase sau altceva, de ex. IONOS).
- Câte zile înainte de curs se decide „are loc / se anulează” (în exemple: 7 zile).
- Listă de așteptare: da / nu.
- Până la Stripe: confirmare imediată sau abia după plata prin transfer bancar.
