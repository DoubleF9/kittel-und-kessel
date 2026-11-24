// Kittel & Kessel – Workshop-Termine (vorläufige, statische Datenquelle).
//
// ⚠ BEISPIELDATEN: Termine, Orte und Preise unten sind Platzhalter und müssen vor dem
//   Livegang durch die echten Termine ersetzt werden.
//
// Solange es noch kein Backend gibt, wird diese Datei von Hand gepflegt:
//   - neuer Termin  → Eintrag hinzufügen
//   - neue Anmeldung bestätigt → `booked` um 1 erhöhen
//   - Termin findet statt / wird abgesagt → `status` auf 'confirmed' / 'cancelled' setzen
//
// Die Felder entsprechen 1:1 der späteren API-Antwort von GET /api/courses
// (siehe docs/inscriere-arhitectura.md), damit das Frontend unverändert bleibt.
window.KK_COURSES = [
  {
    id: 'archetypen-2027-01-23',
    workshop: 'archetypen',            // 'archetypen' | 'symptomaufstellungen'
    start: '2027-01-23T10:00',         // Ortszeit (Europe/Berlin)
    end: '2027-01-23T16:00',
    location: { de: 'Online (Zoom)', ro: 'Online (Zoom)' },
    priceEur: null,                    // Zahl, z. B. 120 – null = „Preis auf Anfrage“
    maxSeats: 6,
    minSeats: 4,
    booked: 2,                         // bestätigte Anmeldungen
    registrationDeadline: '2027-01-16',// letzter Anmeldetag = Tag der Entscheidung „findet statt“
    status: 'open',                    // 'open' | 'confirmed' | 'cancelled'
  },
  {
    id: 'archetypen-2027-03-06',
    workshop: 'archetypen',
    start: '2027-03-06T10:00',
    end: '2027-03-06T16:00',
    location: { de: 'Online (Zoom)', ro: 'Online (Zoom)' },
    priceEur: null,
    maxSeats: 6,
    minSeats: 4,
    booked: 0,
    registrationDeadline: '2027-02-27',
    status: 'open',
  },
  {
    id: 'symptomaufstellungen-2027-02-20',
    workshop: 'symptomaufstellungen',
    start: '2027-02-20T10:00',
    end: '2027-02-20T17:00',
    location: { de: 'Maxstraße 24, Donaustauf', ro: 'Maxstraße 24, Donaustauf (Germania)' },
    priceEur: null,
    maxSeats: 6,
    minSeats: 4,
    booked: 5,
    registrationDeadline: '2027-02-13',
    status: 'confirmed',
  },
  {
    id: 'symptomaufstellungen-2027-04-17',
    workshop: 'symptomaufstellungen',
    start: '2027-04-17T10:00',
    end: '2027-04-17T17:00',
    location: { de: 'Maxstraße 24, Donaustauf', ro: 'Maxstraße 24, Donaustauf (Germania)' },
    priceEur: null,
    maxSeats: 6,
    minSeats: 4,
    booked: 6,
    registrationDeadline: '2027-04-10',
    status: 'confirmed',
  },
];
