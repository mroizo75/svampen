import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  Car, 
  Sparkles, 
  Shield, 
  CheckCircle,
  Clock,
  Droplets,
  Star
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { generateServiceListSchema, generateLocalBusinessSchema } from '@/lib/structured-data'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Våre Tjenester - Profesjonell Bil- og Båtvask | Svampen',
  description: 'Fra enkel vask til komplett bilpleie - vi tilbyr alt du trenger for å holde kjøretøyet ditt i toppstand. Bestill online i dag!',
  keywords: 'bilvask, båtvask, bilpleie, polering, voksing, Kristiansand',
}

async function getServicesForSEO() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        servicePrices: {
          include: {
            vehicleType: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return services.map(service => ({
      ...service,
      servicePrices: service.servicePrices.map(sp => ({
        ...sp,
        price: Number(sp.price),
      })),
    }))
  } catch (error) {
    console.error('Error fetching services for SEO:', error)
    return []
  }
}

async function getBusinessInfo() {
  try {
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['business_name', 'business_phone', 'business_email', 'business_address', 'business_hours_start', 'business_hours_end'],
        },
      },
    })
    
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return {
      name: settingsMap.business_name || 'Svampen',
      phone: settingsMap.business_phone || '',
      email: settingsMap.business_email || '',
      address: settingsMap.business_address || '',
      hoursStart: settingsMap.business_hours_start || '08:00',
      hoursEnd: settingsMap.business_hours_end || '16:00',
    }
  } catch (error) {
    console.error('Error fetching business info:', error)
    return {
      name: 'Svampen',
      phone: '',
      email: '',
      address: '',
      hoursStart: '08:00',
      hoursEnd: '16:00',
    }
  }
}

export default async function TjenesterPage() {
  const services = await getServicesForSEO()
  const businessInfo = await getBusinessInfo()
  
  // Generer structured data for SEO
  const serviceListSchema = generateServiceListSchema(services, businessInfo.name)
  const localBusinessSchema = generateLocalBusinessSchema(businessInfo)

  return (
    <MainLayout>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Våre tjenester</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Fra enkel vask til komplett bilpleie - vi tilbyr alt du trenger for å holde kjøretøyet ditt i toppstand
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Mini Package */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Car className="mr-2 h-6 w-6 text-blue-600" />
                  Mini-pakke
                </CardTitle>
                <CardDescription className="text-lg font-semibold text-blue-600">
                  Fra kr 345,-
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-600">
                  Mini pakken er vår minste pakke, og bestiller du den får du en utvendig vask av bilen din.
                </p>
                
                <h4 className="font-semibold mb-3">Inkluderer:</h4>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Utvendig høytrykksvask
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Hjulvask og hjulbrønner
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Rensing av dørstokker
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Tørking med mikrofiberkleider
                  </li>
                </ul>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="mr-1 h-4 w-4" />
                  Varighet: ca. 30 minutter
                </div>

                <Button className="w-full" asChild>
                  <Link href="/bestill">Bestill Mini-pakke</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Medium Package */}
            <Card className="relative overflow-hidden border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Sparkles className="mr-2 h-6 w-6 text-blue-600" />
                  Medium-pakke
                </CardTitle>
                <CardDescription className="text-lg font-semibold text-blue-600">
                  Fra kr 1450,-
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-600">
                  Dette er en veldig mye brukt pakke når man for eksempel ønsker å holde bilen ren mellom hver gang bilen er polert.
                </p>
                
                <h4 className="font-semibold mb-3">Inkluderer:</h4>
                <ul className="space-y-2 mb-6">
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
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Dørstokk behandling
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Vindusvask innvendig
                  </li>
                </ul>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="mr-1 h-4 w-4" />
                  Varighet: ca. 90 minutter
                </div>

                <Button className="w-full" asChild>
                  <Link href="/bestill">Bestill Medium-pakke</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium Package */}
            <Card className="relative overflow-hidden border-yellow-200 bg-gradient-to-b from-yellow-50 to-white">
              <div className="absolute top-4 right-4">
                <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  BESTSELGER
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Shield className="mr-2 h-6 w-6 text-yellow-600" />
                  Eksklusiv-pakke
                </CardTitle>
                <CardDescription className="text-lg font-semibold text-yellow-700">
                  Fra kr 1990,-
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-600">
                  Eksklusiv pakken er vår desidert BESTSELGENDE pakke med komplett pleie av din bil.
                </p>
                
                <h4 className="font-semibold mb-3">Inkluderer:</h4>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Alt fra Medium-pakke
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Maskin polering
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Voks behandling
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Innvendig totalrens
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Tekstilimpregnering
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Dekk glans
                  </li>
                </ul>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="mr-1 h-4 w-4" />
                  Varighet: ca. 2.5 timer
                </div>

                <Button className="w-full bg-yellow-600 hover:bg-yellow-700" asChild>
                  <Link href="/bestill">Bestill Eksklusiv-pakke</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Services */}
          <div className="border-t pt-16">
            <h2 className="text-3xl font-bold text-center mb-12">Tilleggstjenester</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Utvendig-pakke</CardTitle>
                  <CardDescription>Fra kr 1450,-</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Kun utvendig vask og polering uten innvendig rens.</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    Varighet: ca. 2 timer
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Innvendig rengjøring</CardTitle>
                  <CardDescription>Fra kr 750,-</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Komplett innvendig rengjøring og behandling.</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    Varighet: ca. 90 minutter
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Båtvask</CardTitle>
                  <CardDescription>Fra kr 3800,-</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Utvendig vask og polering av båt på tralle (15-22 fot).</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bobil/Camping</CardTitle>
                  <CardDescription>Fra kr 3900,-</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Utvendig vask og polering av campingvogn/bobil (opp til 6m).</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spesialtjenester</CardTitle>
                  <CardDescription>Tillegg etter behov</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Seterens per stykk: kr 390,-</li>
                    <li>• Tepperens per plass: kr 390,-</li>
                    <li>• Rubbing/ripefjerning: kr 350,-</li>
                    <li>• Lyktepolering: kr 490,-</li>
                    <li>• Ozon behandling: kr 650,-</li>
                    <li>• Motorvask: kr 175,-</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Klar for å bestille?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Velg den pakken som passer best for ditt kjøretøy
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
            <Link href="/bestill">
              Bestill din time nå
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  )
}