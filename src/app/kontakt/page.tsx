import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import Link from 'next/link'

export default function KontaktPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakt oss</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Vi er her for å hjelpe deg! Ta kontakt i dag.
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Telefon */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Telefon</CardTitle>
                <CardDescription>Ring oss for rask hjelp</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="tel:38347470" 
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  38 34 74 70
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Man-Fre: 08:00-16:00
                </p>
              </CardContent>
            </Card>

            {/* E-post */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>E-post</CardTitle>
                <CardDescription>Send oss en melding</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:joachim@amento.no" 
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all"
                >
                  joachim@amento.no
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Vi svarer innen 24 timer
                </p>
              </CardContent>
            </Card>

            {/* Åpningstider */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Åpningstider</CardTitle>
                <CardDescription>Når vi er tilgjengelige</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Mandag - Fredag:</span>
                    <span className="text-gray-600">08:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Lørdag - Søndag:</span>
                    <span className="text-gray-600">Stengt</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adresse/Lokasjon */}
          <Card className="mb-12">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Adresse</CardTitle>
                  <CardDescription>Kom innom oss!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-lg font-semibold mb-2">Svampen - Bil- og Båtpleie</p>
                  <p className="text-gray-600 mb-1">Adresse kommer her</p>
                  <p className="text-gray-600 mb-1">Postnummer Poststed</p>
                  <p className="text-gray-600">Norge</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-500 text-center">
                    📍 Kart kommer her<br />
                    <span className="text-sm">(Google Maps integrasjon)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Book tid */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
              <CardHeader>
                <CardTitle className="text-white">Klar for å bestille?</CardTitle>
                <CardDescription className="text-blue-100">
                  Book din tid online nå - raskt og enkelt!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                  asChild
                >
                  <Link href="/bestill">
                    Bestill tid nå
                    <Send className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Se tjenester */}
            <Card>
              <CardHeader>
                <CardTitle>Utforsk våre tjenester</CardTitle>
                <CardDescription>
                  Se hele utvalget av pakker og priser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/tjenester">
                    Se tjenester
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/prisliste">
                    Se prisliste
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Preview */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Ofte stilte spørsmål</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Hvor lang tid tar behandlingen?</h3>
                <p className="text-sm text-gray-600">
                  Avhengig av pakke - fra 1 time for Mini-pakke til 6+ timer for Eksklusiv-pakke.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Kan jeg vente mens bilen vaskes?</h3>
                <p className="text-sm text-gray-600">
                  Ja, du kan vente hos oss eller vi kan avtale å ringe når bilen er klar.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Hva skjer hvis jeg må avbestille?</h3>
                <p className="text-sm text-gray-600">
                  Gi oss beskjed i god tid, så finner vi en ny tid som passer deg.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Har dere klippekort?</h3>
                <p className="text-sm text-gray-600">
                  Ja! Hver 5. vaskepakke du bestiller får du helt gratis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

