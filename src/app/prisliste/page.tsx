import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Star, Info } from 'lucide-react'

export default function PrislistePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Våre priser</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Her finner du en komplett prisoversikt på våre tjenester for både innvendig og utvendig pleie av bil, båt og caravan.
          </p>
        </div>
      </section>

      {/* Bilpleie Prices */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Bilpleie</CardTitle>
              <CardDescription>Priser for personbiler og varebiler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Beskrivelse</TableHead>
                      <TableHead className="text-right">Pris</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        Mini-pakke (vanlig bil/liten varebil)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 345,-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Mini-pakke (SUV, caravelle, kassebil, minibuss)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 495,-</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50">
                      <TableCell className="font-medium">
                        Medium-pakke (vanlig bil, liten varebil)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 1450,-</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50">
                      <TableCell className="font-medium">
                        Medium-pakke (SUV, caravelle, kassebil, minibuss)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 1590,-</TableCell>
                    </TableRow>
                    <TableRow className="bg-yellow-50 border-yellow-200">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          Eksklusiv-pakke (vanlig bil/liten varebil)
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            BESTSELGER
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 1990,-</TableCell>
                    </TableRow>
                    <TableRow className="bg-yellow-50 border-yellow-200">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          Eksklusiv-pakke (SUV, caravelle, kassebil, minibuss)
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            BESTSELGER
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 2850,-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Utvendig-pakke (vanlig bil/liten varebil)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 1450,-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Utvendig-pakke (SUV, caravelle, kassebil, minibuss)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 1750,-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Innvendig rengjøring (vanlig bil/liten varebil)
                      </TableCell>
                      <TableCell className="text-right font-semibold">kr 750,-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Båtpleie */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Båtpleie</CardTitle>
              <CardDescription>Priser for båtvask og polering</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Beskrivelse</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Utvendig vask/polering båt på tralle (15-22 fot)
                    </TableCell>
                    <TableCell className="text-right font-semibold">kr 3800,-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bobil/Camping */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Bobil/Camping</CardTitle>
              <CardDescription>Priser for campingvogn og bobil</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Beskrivelse</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Utvendig vask/polering campingvogn/bobil (opp til 6m)
                    </TableCell>
                    <TableCell className="text-right font-semibold">kr 3900,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Vask/polering campingvogn/bobil tillegg pr m etter 6m
                    </TableCell>
                    <TableCell className="text-right font-semibold">kr 350,-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tilleggstjenester */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Tilleggstjenester</CardTitle>
              <CardDescription>Ekstra tjenester og spesialbehandlinger</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Beskrivelse</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Seterens 5 seter</TableCell>
                    <TableCell className="text-right font-semibold">kr 1100,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tepperens 5 seter</TableCell>
                    <TableCell className="text-right font-semibold">kr 1100,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Seterens per stykk</TableCell>
                    <TableCell className="text-right font-semibold">kr 390,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tepperens per plass</TableCell>
                    <TableCell className="text-right font-semibold">kr 390,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rubbing (2 timer)</TableCell>
                    <TableCell className="text-right font-semibold">kr 1600,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rubbing/ripefjerning 1 dør eller skjerm</TableCell>
                    <TableCell className="text-right font-semibold">kr 350,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lyktepolering 1 stk</TableCell>
                    <TableCell className="text-right font-semibold">kr 490,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ozon behandling</TableCell>
                    <TableCell className="text-right font-semibold">kr 650,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Motorvask</TableCell>
                    <TableCell className="text-right font-semibold">kr 175,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lakkrens (2 timer)</TableCell>
                    <TableCell className="text-right font-semibold">kr 1600,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Henting/bringing innen 4 km</TableCell>
                    <TableCell className="text-right font-semibold">kr 130,-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Underspyling</TableCell>
                    <TableCell className="text-right font-semibold">kr 175,-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Important Info */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Info className="mr-2 h-5 w-5" />
                Viktig informasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="text-orange-700">
              <p className="mb-4">
                <strong>Timer som ikke blir benyttet/ikke møtt vil bli fakturert 50%.</strong>
              </p>
              <p className="mb-4">
                Vi ber om at du gir beskjed i god tid dersom du må avbestille eller flytte din time.
              </p>

            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Klar for å bestille?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Velg den pakken som passer best for ditt kjøretøy og bestill din time i dag
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