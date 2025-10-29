'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, AlertTriangle, Users, FileText, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export default function UtstyrRapporterPage() {
  const [expiringSoon, setExpiringSoon] = useState<any[]>([])
  const [expired, setExpired] = useState<any[]>([])
  const [uncertifiedEquipment, setUncertifiedEquipment] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCertifications: 0,
    activeCertifications: 0,
    expiringSoon: 0,
    expired: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Hent sertifiseringer som utløper snart
        const expiringSoonRes = await fetch('/api/admin/certifications?expiringSoon=30&isActive=true')
        const expiringSoonData = await expiringSoonRes.json()
        setExpiringSoon(expiringSoonData)

        // Hent alle sertifiseringer for å finne utløpte
        const allCertsRes = await fetch('/api/admin/certifications?isActive=true')
        const allCerts = await allCertsRes.json()

        const expiredCerts = allCerts.filter((cert: any) => {
          if (!cert.expiresAt) return false
          return new Date(cert.expiresAt).getTime() < Date.now()
        })
        setExpired(expiredCerts)

        // Hent utstyr uten sertifiserte brukere
        const equipmentRes = await fetch('/api/admin/equipment')
        const equipment = await equipmentRes.json()
        const uncertified = equipment.filter((eq: any) => 
          eq.requiresTraining && eq.stats.certifiedUsers === 0
        )
        setUncertifiedEquipment(uncertified)

        // Beregn statistikk
        const activeCerts = allCerts.filter((cert: any) => {
          if (!cert.expiresAt) return true
          return new Date(cert.expiresAt).getTime() >= Date.now()
        }).length

        setStats({
          totalCertifications: allCerts.length,
          activeCertifications: activeCerts,
          expiringSoon: expiringSoonData.length,
          expired: expiredCerts.length,
        })
      } catch (error) {
        console.error('Feil ved henting av data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = ['Bruker', 'E-post', 'Utstyr', 'Nivå', 'Sertifisert dato', 'Utløper']
    const rows = data.map((cert) => [
      `${cert.user.firstName} ${cert.user.lastName}`,
      cert.user.email,
      cert.equipment.name,
      cert.certificationLevel,
      format(new Date(cert.certificationDate), 'yyyy-MM-dd'),
      cert.expiresAt ? format(new Date(cert.expiresAt), 'yyyy-MM-dd') : 'Ingen utløp',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (loading) {
    return <div className="p-8 text-center">Laster...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Utstyr & Opplæring - Rapporter</h1>
        <p className="text-gray-500 mt-1">
          Oversikt over sertifiseringer som krever oppfølging
        </p>
      </div>

      {/* Statistikk-kort */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale sertifiseringer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertifications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCertifications} aktive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utløper snart</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Innen 30 dager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utløpte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Krever fornyelse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usertifisert utstyr</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uncertifiedEquipment.length}</div>
            <p className="text-xs text-muted-foreground">
              Krever opplæring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for ulike rapporter */}
      <Tabs defaultValue="expiring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expiring">
            Utløper snart ({expiringSoon.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Utløpte ({expired.length})
          </TabsTrigger>
          <TabsTrigger value="uncertified">
            Usertifisert utstyr ({uncertifiedEquipment.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sertifiseringer som utløper snart</CardTitle>
                  <CardDescription>
                    Sertifiseringer som utløper innen 30 dager
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(expiringSoon, 'utløper_snart')}
                  disabled={expiringSoon.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Eksporter CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expiringSoon.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen sertifiseringer utløper innen 30 dager
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Utstyr</TableHead>
                      <TableHead>Nivå</TableHead>
                      <TableHead>Utløper</TableHead>
                      <TableHead>Dager igjen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringSoon.map((cert) => {
                      const daysLeft = Math.floor(
                        (new Date(cert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      )
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {cert.user.firstName} {cert.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{cert.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{cert.equipment.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cert.certificationLevel}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cert.expiresAt), 'PPP', { locale: nb })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                daysLeft <= 7
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }
                            >
                              {daysLeft} dager
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Utløpte sertifiseringer</CardTitle>
                  <CardDescription>
                    Sertifiseringer som må fornyes
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(expired, 'utløpte')}
                  disabled={expired.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Eksporter CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expired.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen utløpte sertifiseringer
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Utstyr</TableHead>
                      <TableHead>Nivå</TableHead>
                      <TableHead>Utløpt dato</TableHead>
                      <TableHead>Dager siden utløp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expired.map((cert) => {
                      const daysSince = Math.floor(
                        (Date.now() - new Date(cert.expiresAt).getTime()) / (1000 * 60 * 60 * 24)
                      )
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {cert.user.firstName} {cert.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{cert.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{cert.equipment.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cert.certificationLevel}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cert.expiresAt), 'PPP', { locale: nb })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {daysSince} dager siden
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uncertified">
          <Card>
            <CardHeader>
              <CardTitle>Utstyr uten sertifiserte brukere</CardTitle>
              <CardDescription>
                Utstyr som krever opplæring men ingen har sertifisering
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uncertifiedEquipment.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Alt utstyr har minst én sertifisert bruker
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Minimum nivå</TableHead>
                      <TableHead>Plassering</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uncertifiedEquipment.map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{eq.name}</div>
                            {eq.manufacturer && (
                              <div className="text-sm text-gray-500">
                                {eq.manufacturer} {eq.model}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{eq.category}</Badge>
                        </TableCell>
                        <TableCell>{eq.minimumTrainingLevel}</TableCell>
                        <TableCell>{eq.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

