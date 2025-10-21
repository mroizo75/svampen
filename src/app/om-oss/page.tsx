import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Award, Users, Shield, Clock, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function OmOssPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Om Svampen</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Profesjonell bil- og båtpleie med over 10 års erfaring
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Intro */}
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-6">Hvem er vi?</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Svampen er din pålitelige partner for profesjonell bil- og båtpleie. Med over 10 års erfaring 
                i bransjen leverer vi kvalitetstjenester til konkurransedyktige priser.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Vi brenner for å holde ditt kjøretøy i topp stand, enten det er en bil, bobil eller båt. 
                Vårt mål er å gi deg den beste servicen med høy kvalitet på arbeidet.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-blue-600">10+</CardTitle>
                  <CardDescription className="text-lg">År med erfaring</CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-green-600">1000+</CardTitle>
                  <CardDescription className="text-lg">Fornøyde kunder</CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-purple-600">100%</CardTitle>
                  <CardDescription className="text-lg">Kvalitetsgaranti</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Our Values */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Våre verdier</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle>Kvalitet</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Vi bruker kun de beste produktene og metodene for å sikre at ditt kjøretøy 
                      får den behandlingen det fortjener.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <CardTitle>Punktlighet</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Din tid er verdifull. Vi holder alltid avtaler og leverer når vi lover.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <CardTitle>Kundefokus</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Våre kunder står i sentrum. Vi lytter til dine behov og tilpasser tjenestene deretter.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-orange-600" />
                      </div>
                      <CardTitle>Erfaring</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Med over 10 års erfaring vet vi nøyaktig hva som skal til for å levere perfekte resultater.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* What We Offer */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Våre tjenester</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">🚗 Bilvask</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Mini-pakke: Grunnleggende vask</li>
                    <li>• Medium-pakke: Utvendig og innvendig</li>
                    <li>• Eksklusiv-pakke: Komplett behandling</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">⛵ Båtvask</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Utvendig vask og polering</li>
                    <li>• Innvendig rengjøring</li>
                    <li>• Voks og beskyttelse</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">🚐 Bobil/Camping</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Spesialtilpassede pakker</li>
                    <li>• Stort og smått</li>
                    <li>• Erfaring med alle typer</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">✨ Spesialbehandlinger</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Polering og rubbing</li>
                    <li>• Keramisk belegg</li>
                    <li>• Interiørbehandling</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-blue-50 p-8 rounded-lg mb-12">
              <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">Hvorfor velge Svampen?</h2>
              <div className="grid md:grid-cols-2 gap-6 text-blue-800">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Profesjonell kvalitet</h4>
                    <p className="text-sm">Vi bruker profesjonelt utstyr og produkter</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Konkurransedyktige priser</h4>
                    <p className="text-sm">Kvalitet til rettferdig pris</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Erfarne medarbeidere</h4>
                    <p className="text-sm">10+ års erfaring i bransjen</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Rask service</h4>
                    <p className="text-sm">Effektiv håndtering uten å gå på kompromiss</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Miljøvennlige produkter</h4>
                    <p className="text-sm">Vi tenker på miljøet</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">✓</div>
                  <div>
                    <h4 className="font-semibold mb-1">Fleksibel booking</h4>
                    <p className="text-sm">Book enkelt online når det passer deg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Klar til å gi ditt kjøretøy profesjonell pleie?</h2>
                  <p className="text-xl text-blue-100 mb-6">
                    Kontakt oss i dag for en uforpliktende prat om dine behov
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                    <a 
                      href="tel:38347470" 
                      className="flex items-center justify-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      <span>38 34 74 70</span>
                    </a>
                    <a 
                      href="mailto:joachim@amento.no" 
                      className="flex items-center justify-center space-x-2 bg-blue-700 text-white border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      <span>Send e-post</span>
                    </a>
                  </div>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                    <Link href="/bestill">
                      Bestill tid online
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

