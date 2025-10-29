'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit, AlertTriangle, CheckCircle, FileText, Wrench, Users, Calendar, GitBranch } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { TrainingChainView } from '@/components/admin/training-chain-view'

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [equipment, setEquipment] = useState<any>(null)
  const [trainingChain, setTrainingChain] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hent utstyr
        const equipmentResponse = await fetch(`/api/admin/equipment/${params.id}`)
        if (!equipmentResponse.ok) throw new Error('Fant ikke utstyr')
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData)

        // Hent opplæringskjede
        const chainResponse = await fetch(`/api/admin/equipment/${params.id}/training-chain`)
        if (chainResponse.ok) {
          const chainData = await chainResponse.json()
          setTrainingChain(chainData)
        }
      } catch (error) {
        console.error('Feil ved henting av data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return <div className="p-8 text-center">Laster...</div>
  }

  if (!equipment) {
    return <div className="p-8 text-center">Utstyr ikke funnet</div>
  }

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      BASIC: 'Grunnleggende',
      INTERMEDIATE: 'Selvstendig',
      ADVANCED: 'Avansert',
      TRAINER: 'Opplærer',
      SUPPLIER: 'Leverandør',
    }
    return levels[level] || level
  }

  const getCertificationStatus = (cert: any) => {
    if (!cert.isActive) return { label: 'Tilbakekalt', color: 'gray' }
    if (!cert.expiresAt) return { label: 'Aktiv', color: 'green' }
    
    const daysUntilExpiry = Math.floor(
      (new Date(cert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilExpiry < 0) return { label: 'Utløpt', color: 'red' }
    if (daysUntilExpiry <= 30) return { label: `Utløper om ${daysUntilExpiry} dager`, color: 'yellow' }
    return { label: 'Aktiv', color: 'green' }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/utstyr')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-500 mt-1">
              {equipment.manufacturer} {equipment.model}
            </p>
          </div>
        </div>
        <Badge variant={equipment.isActive ? 'outline' : 'secondary'}>
          {equipment.isActive ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      {/* Grunnleggende info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Utstyrsinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Kategori:</div>
              <div className="font-medium">{equipment.category}</div>

              {equipment.serialNumber && (
                <>
                  <div className="text-gray-500">Serienummer:</div>
                  <div className="font-medium">{equipment.serialNumber}</div>
                </>
              )}

              {equipment.location && (
                <>
                  <div className="text-gray-500">Plassering:</div>
                  <div className="font-medium">{equipment.location}</div>
                </>
              )}

              {equipment.purchaseDate && (
                <>
                  <div className="text-gray-500">Kjøpsdato:</div>
                  <div className="font-medium">
                    {format(new Date(equipment.purchaseDate), 'PPP', { locale: nb })}
                  </div>
                </>
              )}
            </div>

            {equipment.description && (
              <div className="pt-3 border-t">
                <div className="text-sm text-gray-500 mb-1">Beskrivelse:</div>
                <p className="text-sm">{equipment.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Opplæringskrav
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Krever opplæring:</span>
              {equipment.requiresTraining ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Ja
                </Badge>
              ) : (
                <Badge variant="outline">Nei</Badge>
              )}
            </div>

            {equipment.requiresTraining && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Minimum nivå:</span>
                  <Badge variant="outline">{getLevelLabel(equipment.minimumTrainingLevel)}</Badge>
                </div>

                {equipment.trainingValidityDays && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Gyldighet:</span>
                    <span className="text-sm font-medium">{equipment.trainingValidityDays} dager</span>
                  </div>
                )}
              </>
            )}

            <div className="pt-3 border-t">
              <div className="text-sm text-gray-500 mb-1">Sertifiserte brukere:</div>
              <div className="text-2xl font-bold">
                {equipment.userCertifications.filter((c: any) => c.isActive).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sikkerhetsinformasjon */}
      {(equipment.riskAssessment || equipment.safetyInstructions || equipment.emergencyProcedures) && (
        <Card>
          <CardHeader>
            <CardTitle>Sikkerhetsinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {equipment.riskAssessment && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Risikovurdering</h4>
                <p className="text-sm text-gray-700">{equipment.riskAssessment}</p>
              </div>
            )}

            {equipment.safetyInstructions && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Sikkerhetsinstruksjoner</h4>
                <p className="text-sm text-gray-700">{equipment.safetyInstructions}</p>
              </div>
            )}

            {equipment.emergencyProcedures && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Nødprosedyrer</h4>
                <p className="text-sm text-gray-700">{equipment.emergencyProcedures}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for sertifiseringer, opplæring og vedlikehold */}
      <Tabs defaultValue="chain" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chain">
            <GitBranch className="mr-2 h-4 w-4" />
            Opplæringskjede
          </TabsTrigger>
          <TabsTrigger value="certifications">
            <Users className="mr-2 h-4 w-4" />
            Sertifiseringer ({equipment.userCertifications.length})
          </TabsTrigger>
          <TabsTrigger value="training">
            <Calendar className="mr-2 h-4 w-4" />
            Opplæringsøkter ({equipment.trainingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="mr-2 h-4 w-4" />
            Vedlikehold ({equipment.maintenanceLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chain">
          <Card>
            <CardHeader>
              <CardTitle>Opplæringskjede - Leverandør til ansatte</CardTitle>
              <CardDescription>
                Visuell oversikt over hvem som har opplært hvem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingChainView equipmentId={params.id as string} data={trainingChain} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle>Sertifiserte brukere</CardTitle>
              <CardDescription>
                Oversikt over alle som er sertifisert på dette utstyret
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipment.userCertifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen sertifiseringer ennå
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Nivå</TableHead>
                      <TableHead>Sertifisert dato</TableHead>
                      <TableHead>Utløper</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.userCertifications.map((cert: any) => {
                      const status = getCertificationStatus(cert)
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
                          <TableCell>
                            <Badge variant="outline">{getLevelLabel(cert.certificationLevel)}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cert.certificationDate), 'PPP', { locale: nb })}
                          </TableCell>
                          <TableCell>
                            {cert.expiresAt ? (
                              format(new Date(cert.expiresAt), 'PPP', { locale: nb })
                            ) : (
                              <span className="text-gray-500">Ingen utløp</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                status.color === 'green'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : status.color === 'yellow'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : status.color === 'red'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }
                            >
                              {status.label}
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

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Opplæringsøkter</CardTitle>
              <CardDescription>
                Historikk over gjennomførte opplæringsøkter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipment.trainingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen opplæringsøkter registrert
                </div>
              ) : (
                <div className="space-y-4">
                  {equipment.trainingSessions.map((session: any) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-500">
                              {format(new Date(session.trainingDate), 'PPP', { locale: nb })}
                            </span>
                            {session.instructorName && (
                              <span className="text-gray-500">Instruktør: {session.instructorName}</span>
                            )}
                            {session.provider && (
                              <Badge variant="outline">{session.provider.name}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={session.isCompleted ? 'outline' : 'secondary'}>
                          {session.isCompleted ? 'Fullført' : 'Planlagt'}
                        </Badge>
                      </div>
                      {session.certifications.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm text-gray-500">
                            {session.certifications.length} deltaker(e)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Vedlikeholdslogg</CardTitle>
              <CardDescription>
                Historikk over vedlikehold og inspeksjoner
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipment.maintenanceLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen vedlikehold registrert
                </div>
              ) : (
                <div className="space-y-4">
                  {equipment.maintenanceLogs.map((log: any) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{log.type}</Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(log.performedDate), 'PPP', { locale: nb })}
                            </span>
                          </div>
                          <p className="text-sm mt-2">{log.description}</p>
                          <p className="text-sm text-gray-500 mt-1">Utført av: {log.performedBy}</p>
                        </div>
                        {log.cost && (
                          <span className="font-semibold">{log.cost} kr</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

