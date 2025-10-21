import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function PersonvernPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">Personvernerklæring</h1>
          <p className="text-center text-gray-600">
            Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Innledning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Svampen ("vi", "oss", "vår") respekterer ditt personvern og er forpliktet til å beskytte dine personopplysninger. 
                Denne personvernerklæringen forklarer hvordan vi samler inn, bruker og beskytter informasjonen din når du bruker 
                vårt booking-system og våre tjenester.
              </p>
              <p>
                Ved å bruke våre tjenester aksepterer du innsamling og bruk av informasjon i samsvar med denne erklæringen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Informasjon vi samler inn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personopplysninger</h3>
                <p className="mb-2">Når du bruker våre tjenester, kan vi samle inn følgende informasjon:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Navn (fornavn og etternavn)</li>
                  <li>E-postadresse</li>
                  <li>Telefonnummer</li>
                  <li>Kjøretøyinformasjon (bilmerke, modell, registreringsnummer)</li>
                  <li>Bookinghistorikk og preferanser</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Teknisk informasjon</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>IP-adresse</li>
                  <li>Nettlesertype og versjon</li>
                  <li>Enhetstype</li>
                  <li>Besøkstidspunkt og aktivitet på nettstedet</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Hvordan vi bruker informasjonen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Vi bruker informasjonen din til følgende formål:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Behandle og administrere dine bookinger</li>
                <li>Kommunisere med deg om dine avtaler (e-post og SMS)</li>
                <li>Sende bekreftelser og påminnelser om dine avtaler</li>
                <li>Forbedre våre tjenester og kundeopplevelse</li>
                <li>Sende fakturaer og håndtere betalinger</li>
                <li>Overholde juridiske forpliktelser</li>
                <li>Administrere din brukerkonto</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Deling av informasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vi selger eller leier aldri ut dine personopplysninger til tredjeparter. Vi kan dele informasjon med:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Tjenesteleverandører:</strong> Vi bruker pålitelige tredjepartstjenester for e-post (Resend) 
                  og SMS (proSMS) for å kommunisere med deg
                </li>
                <li>
                  <strong>Juridiske krav:</strong> Når det er nødvendig for å overholde lover eller rettskjennelser
                </li>
                <li>
                  <strong>Forretningsoverføringer:</strong> Ved fusjoner, oppkjøp eller salg av virksomheten
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Datasikkerhet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vi tar sikkerheten til dine personopplysninger på alvor og implementerer passende tekniske og 
                organisatoriske tiltak for å beskytte dem mot uautorisert tilgang, endring, avsløring eller ødeleggelse.
              </p>
              <p>Våre sikkerhetstiltak inkluderer:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Krypterte passordhashinger (bcrypt)</li>
                <li>Sikre HTTPS-forbindelser</li>
                <li>Begrenset tilgang til personopplysninger</li>
                <li>Regelmessige sikkerhetsoppdateringer</li>
                <li>Database-backup</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Dine rettigheter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">I henhold til GDPR har du følgende rettigheter:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Rett til innsyn:</strong> Be om en kopi av dine personopplysninger</li>
                <li><strong>Rett til retting:</strong> Be om at vi korrigerer unøyaktige opplysninger</li>
                <li><strong>Rett til sletting:</strong> Be om at vi sletter dine personopplysninger</li>
                <li><strong>Rett til begrensning:</strong> Be om at vi begrenser behandlingen av dine opplysninger</li>
                <li><strong>Rett til dataportabilitet:</strong> Be om å motta dine data i et strukturert format</li>
                <li><strong>Rett til å protestere:</strong> Protestere mot vår behandling av dine opplysninger</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Informasjonskapsler (Cookies)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Vi bruker informasjonskapsler for å forbedre din opplevelse på nettstedet vårt. Informasjonskapsler 
                er små tekstfiler som lagres på enheten din.
              </p>
              <p>Vi bruker følgende typer cookies:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Nødvendige cookies:</strong> For autentisering og grunnleggende funksjonalitet</li>
                <li><strong>Funksjonelle cookies:</strong> For å huske dine preferanser</li>
              </ul>
              <p>
                Du kan blokkere cookies gjennom nettleserinnstillingene dine, men dette kan påvirke funksjonaliteten 
                til nettstedet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Oppbevaring av data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Vi oppbevarer dine personopplysninger så lenge det er nødvendig for å oppfylle formålene beskrevet i 
                denne erklæringen, med mindre lengre oppbevaringstid er påkrevd eller tillatt av loven.
              </p>
              <p className="mt-4">
                Bookinghistorikk og fakturaer oppbevares i henhold til norsk regnskapslovgivning (minimum 5 år).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Endringer i personvernerklæringen</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Vi kan oppdatere denne personvernerklæringen fra tid til annen. Vi vil varsle deg om vesentlige endringer 
                ved å legge ut den nye erklæringen på denne siden og oppdatere "sist oppdatert"-datoen.
              </p>
              <p className="mt-4">
                Vi anbefaler at du regelmessig sjekker denne siden for eventuelle endringer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Kontakt oss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Hvis du har spørsmål om denne personvernerklæringen eller ønsker å utøve dine rettigheter, 
                vennligst kontakt oss:
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

