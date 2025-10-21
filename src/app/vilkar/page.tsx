import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function VilkarPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">Brukervilkår</h1>
          <p className="text-center text-gray-600">
            Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Aksept av vilkår</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Ved å bruke Svampens booking-system og tjenester aksepterer du å være bundet av disse vilkårene. 
                Hvis du ikke godtar disse vilkårene, skal du ikke bruke våre tjenester.
              </p>
              <p>
                Vi forbeholder oss retten til å endre disse vilkårene når som helst. Vesentlige endringer vil bli 
                kommunisert via e-post eller på nettstedet vårt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Booking og bekreftelse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">2.1 Booking-prosessen</h3>
                  <p>
                    Når du gjennomfører en booking gjennom vårt system, mottar du en bekreftelse på e-post og SMS. 
                    Bookingen anses som bekreftet når du mottar denne bekreftelsen.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2.2 Nøyaktighet av informasjon</h3>
                  <p>
                    Det er ditt ansvar å sikre at all informasjon du oppgir (navn, kontaktinformasjon, kjøretøydetaljer) 
                    er korrekt og oppdatert. Feil informasjon kan føre til forsinkelser eller kansellering av tjenesten.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2.3 Påminnelser</h3>
                  <p>
                    Vi sender SMS-påminnelse dagen før din avtalte tid. Det er likevel ditt ansvar å møte opp til 
                    avtalt tid, selv om påminnelsen ikke skulle komme fram.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Avbestilling og endringer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">3.1 Avbestilling fra kunde</h3>
                  <p>
                    Du kan avbestille eller endre din booking ved å kontakte oss minimum 24 timer før avtalt tid. 
                    Avbestillinger med kortere varsel kan medføre gebyr.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3.2 No-show (ikke møtt opp)</h3>
                  <p>
                    Hvis du ikke møter opp til avtalt tid uten å ha varslet oss, kan et gebyr faktureres. 
                    Gebyr-satsen fremgår av innstillingene i systemet.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3.3 Avbestilling fra Svampen</h3>
                  <p>
                    Vi forbeholder oss retten til å avbestille eller endre bookinger i tilfelle force majeure, 
                    sykdom, tekniske problemer eller andre uforutsette hendelser. I slike tilfeller vil vi 
                    kontakte deg umiddelbart for å finne en alternativ løsning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Priser og betaling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">4.1 Prising</h3>
                  <p>
                    Alle priser er oppgitt i norske kroner (NOK) og inkluderer mva. Prisene som vises i booking-systemet 
                    er gjeldende på bestillingstidspunktet.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4.2 Betalingsmetoder</h3>
                  <p>Vi aksepterer følgende betalingsmetoder:</p>
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Kontant betaling</li>
                    <li>Kortbetaling (på stedet)</li>
                    <li>Faktura (etter fullført tjeneste)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4.3 Fakturering</h3>
                  <p>
                    Faktura sendes etter at tjenesten er fullført. Betalingsfrist er 14 dager fra fakturadato, 
                    med mindre annet er avtalt. Ved forsinket betaling kan purregebyr og forsinkelsesrenter påløpe.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4.4 Prisendringer</h3>
                  <p>
                    Vi forbeholder oss retten til å endre priser uten forvarsel. Prisendringer gjelder ikke 
                    allerede bekreftede bookinger.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Vårt ansvar og forbehold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">5.1 Kvalitetsgaranti</h3>
                  <p>
                    Vi streber etter å levere tjenester av høyeste kvalitet. Hvis du ikke er fornøyd med resultatet, 
                    vennligst kontakt oss innen 24 timer slik at vi kan rette opp eventuelle mangler.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5.2 Ansvarsbegrensning</h3>
                  <p>
                    Vi er ikke ansvarlige for skader på kjøretøyet som følge av eksisterende problemer, 
                    skjulte mangler eller normal slitasje. Synlige skader vil bli dokumentert før arbeidet påbegynnes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5.3 Kundens ansvar</h3>
                  <p>Kunden er ansvarlig for:</p>
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>Å fjerne personlige eiendeler fra kjøretøyet</li>
                    <li>Å informere om eventuelle spesielle forhold ved kjøretøyet</li>
                    <li>Å ha gyldig forsikring på kjøretøyet</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Brukerkonto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">6.1 Konto-oppretting</h3>
                  <p>
                    For å bruke vårt booking-system kan du opprette en brukerkonto. Du er ansvarlig for å holde 
                    din påloggingsinformasjon konfidensiell og for all aktivitet som skjer under din konto.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6.2 Konto-sikkerhet</h3>
                  <p>
                    Hvis du oppdager uautorisert bruk av kontoen din, må du umiddelbart varsle oss. 
                    Vi er ikke ansvarlige for tap som følge av uautorisert bruk av din konto.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6.3 Sletting av konto</h3>
                  <p>
                    Du kan når som helst be om å få slettet din konto ved å kontakte oss. 
                    Vær oppmerksom på at visse data kan bli beholdt for regnskapsmessige og juridiske formål.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Immaterielle rettigheter</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Alt innhold på vårt nettsted og i vårt booking-system, inkludert tekst, grafikk, logoer, bilder 
                og programvare, er beskyttet av opphavsrett og andre immaterielle rettigheter. Du får ikke lov til 
                å kopiere, reprodusere, distribuere eller bruke noe av dette innholdet uten vår skriftlige tillatelse.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Ansvarsfraskrivelse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Våre tjenester leveres "som de er". Vi garanterer ikke at:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Tjenestene vil være uavbrutte eller feilfrie</li>
                <li>Feil vil bli rettet umiddelbart</li>
                <li>Nettstedet eller serverne er fri for virus eller skadelig kode</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Personvern</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Din bruk av våre tjenester er også underlagt vår{' '}
                <a href="/personvern" className="text-blue-600 hover:underline">Personvernerklæring</a>. 
                Vennligst les den for å forstå hvordan vi behandler dine personopplysninger.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Tvisteløsning og lovvalg</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">10.1 Lovvalg</h3>
                  <p>
                    Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal løses i norske domstoler.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">10.2 Klager</h3>
                  <p>
                    Hvis du har klager eller spørsmål om våre tjenester, vennligst kontakt oss først for å 
                    finne en løsning. Vi vil gjøre vårt beste for å løse eventuelle problemer på en tilfredsstillende måte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Kontakt informasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Ved spørsmål om disse vilkårene, vennligst kontakt oss:
              </p>
              <div className="space-y-2">
                <p><strong>E-post:</strong> <a href="mailto:joachim@amento.no" className="text-blue-600 hover:underline">joachim@amento.no</a></p>
                <p><strong>Telefon:</strong> <a href="tel:38347470" className="text-blue-600 hover:underline">38 34 74 70</a></p>
                <p><strong>Organisasjon:</strong> Svampen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

