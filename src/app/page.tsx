import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  Car, 
  Clock, 
  Star, 
  CheckCircle,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Profesjonell bil- og båtpleie
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Vi har mer enn 10 års erfaring og leverer kvalitet til konkurransedyktige priser!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold" asChild>
                <Link href="/bestill">
                  <Clock className="mr-2 h-5 w-5" />
                  Bestill tid nå
                </Link>
              </Button>
              <Button size="lg" className="bg-blue-700 text-white border-2 border-white hover:bg-white hover:text-blue-700 font-semibold" asChild>
                <Link href="/tjenester">
                  Se våre tjenester
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Våre tjenester</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fra enkel vask til komplett pleie - vi har pakken som passer ditt behov
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mini Package */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="mr-2 h-5 w-5 text-blue-600" />
                  Mini-pakke
                </CardTitle>
                <CardDescription>Fra kr 345,-</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Vår minste pakke med utvendig vask av bilen din.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Utvendig vask
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Hjulvask
                  </li>
                </ul>
                <Button className="w-full mt-4" asChild>
                  <Link href="/bestill">Bestill nå</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Medium Package */}
            <Card className="relative overflow-hidden border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                  Medium-pakke
                </CardTitle>
                <CardDescription>Fra kr 1450,-</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Populær pakke for å holde bilen ren mellom hver polering.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Alt fra Mini-pakke
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Innvendig støvsuging
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Dashbord behandling
                  </li>
                </ul>
                <Button className="w-full mt-4" asChild>
                  <Link href="/bestill">Bestill nå</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium Package */}
            <Card className="relative overflow-hidden border-gold bg-gradient-to-b from-yellow-50 to-white">
              <div className="absolute top-4 right-4">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-yellow-600" />
                  Eksklusiv-pakke
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  <strong>BESTSELGER</strong> - Fra kr 1990,-
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Vår desidert mest populære pakke med komplett pleie.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Alt fra Medium-pakke
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Polering
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Voks behandling
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Innvendig rens
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700" asChild>
                  <Link href="/bestill">Bestill nå</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Klar for å gi bilen din den pleien den fortjener?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Book din time i dag og opplev forskjellen profesjonell bilpleie gjør
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
            <Link href="/bestill">
              Bestill tid nå
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Customer Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Hvorfor velge Svampen?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">10+ års erfaring</h3>
              <p className="text-gray-600 text-sm">Profesjonell kvalitet du kan stole på</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Enkel booking</h3>
              <p className="text-gray-600 text-sm">Book online når det passer deg</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Rask service</h3>
              <p className="text-gray-600 text-sm">Effektiv håndtering av din bil</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Konkurransedyktige priser</h3>
              <p className="text-gray-600 text-sm">Kvalitet til rettferdig pris</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
