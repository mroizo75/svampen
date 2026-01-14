# Database Scripts

## Prisoppdatering 2026

### Beskrivelse
Dette scriptet oppdaterer alle tjenestepriser basert på den nye prislisten for 2026.

### Hvordan bruke

1. **Før du kjører scriptet:**
   - Sørg for at du har en backup av databasen
   - Sjekk at DATABASE_URL er satt korrekt i `.env`

2. **Kjør scriptet:**
   ```bash
   npm run update-prices
   ```

3. **Verifiser resultatet:**
   - Scriptet viser antall oppdaterte tjenester
   - Sjekk admin-panelet for å bekrefte at prisene er korrekte

### Hva scriptet gjør

- Leser prisene fra den nye prislisten (ekskl. MVA)
- Finner matchende tjenester i databasen
- Oppdaterer alle priser for hver tjeneste (alle kjøretøytyper)
- Gir rapport om:
  - ✅ Antall oppdaterte tjenester
  - ⚠️ Tjenester som ikke ble funnet
  - ❌ Feil som oppstod

### Prisliste oppdatert
- **Dato:** Januar 2026
- **Antall tjenester:** 36
- **Pristype:** Ekskl. MVA

### Viktig informasjon

⚠️ **ADVARSEL:** Dette scriptet oppdaterer priser i produksjonsdatabasen!

- Test først i utviklingsmiljø hvis mulig
- Ta alltid backup før du kjører scriptet
- Verifiser resultatet etter kjøring

### Feilsøking

**Problem:** "Fant ikke tjeneste"
- **Løsning:** Sjekk at tjenestenavnet i scriptet matcher nøyaktig med navnet i databasen

**Problem:** "Ingen priser å oppdatere"
- **Løsning:** Tjenesten finnes, men har ingen priser i ServicePrice-tabellen

**Problem:** Database-feil
- **Løsning:** Sjekk DATABASE_URL og database-tilkobling

### Se også
- `prisma/seed.ts` - Initial database seeding
- `prisma/schema.prisma` - Database schema
