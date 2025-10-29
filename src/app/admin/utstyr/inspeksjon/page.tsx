'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, CheckCircle, XCircle, AlertTriangle, FileText, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export default function InspeksjonPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/equipment/inspector-report')
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Feil ved henting av rapport:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    // TODO: Implementer PDF-generering
    alert('PDF-generering kommer snart')
  }

  const downloadJSON = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inspeksjonsrapport_${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
  }

  const printReport = () => {
    window.print()
  }

  if (loading) {
    return <div className="p-8 text-center">Laster rapport...</div>
  }

  if (!report) {
    return <div className="p-8 text-center">Kunne ikke laste rapport</div>
  }

  return (
    <div className="p-8 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start print:block">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspeksjonsrapport - Utstyrsspesifikk Opplæring</h1>
          <p className="text-gray-500 mt-1">
            I henhold til Arbeidsmiljøloven § 4-5
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Generert: {format(new Date(report.generatedAt), 'PPPp', { locale: nb })}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={printReport}>
            <FileText className="mr-2 h-4 w-4" />
            Skriv ut
          </Button>
          <Button variant="outline" onClick={downloadJSON}>
            <Download className="mr-2 h-4 w-4" />
            Last ned JSON
          </Button>
          <Button onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Last ned PDF
          </Button>
        </div>
      </div>

      {/* Bedriftsinformasjon */}
      <Card className="print:shadow-none print:border-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Bedriftsinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Bedriftsnavn:</span>
            <div className="font-medium">{report.companyInfo.name}</div>
          </div>
          {report.companyInfo.orgNumber && (
            <div>
              <span className="text-sm text-gray-500">Org.nr:</span>
              <div className="font-medium">{report.companyInfo.orgNumber}</div>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-500">Rapport generert av:</span>
            <div className="font-medium">{report.generatedBy.name}</div>
          </div>
          <div>
            <span className="text-sm text-gray-500">E-post:</span>
            <div className="font-medium">{report.generatedBy.email}</div>
          </div>
        </CardContent>
      </Card>

      {/* Samlet status */}
      <Card className={`print:shadow-none print:border-2 ${
        report.compliance.status === 'I ORDEN' 
          ? 'border-green-200 bg-green-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Samlet vurdering</span>
            {report.compliance.status === 'I ORDEN' ? (
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                <CheckCircle className="mr-2 h-5 w-5" />
                I ORDEN
              </Badge>
            ) : (
              <Badge className="bg-red-600 text-white text-lg px-4 py-2">
                <XCircle className="mr-2 h-5 w-5" />
                AVVIK FUNNET
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {report.compliance.arbeidsmiljoloven}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{report.stats.totalEquipment}</div>
              <div className="text-sm text-gray-500">Totalt utstyr</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-green-600">{report.stats.compliantEquipment}</div>
              <div className="text-sm text-gray-500">I orden</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-red-600">{report.stats.nonCompliantEquipment}</div>
              <div className="text-sm text-gray-500">Mangler</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{report.stats.totalCertifiedUsers}</div>
              <div className="text-sm text-gray-500">Sertifiserte brukere</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-green-600">{report.stats.totalActiveCertifications}</div>
              <div className="text-sm text-gray-500">Aktive sertifikater</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{report.stats.totalExpiredCertifications}</div>
              <div className="text-sm text-gray-500">Utløpte sertifikater</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <p className="font-medium">{report.compliance.notes}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detaljert oversikt per utstyr */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Detaljert oversikt</h2>
        
        {report.equipment.map((eq: any, index: number) => (
          <Card key={index} className="print:break-inside-avoid print:shadow-none print:border-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{eq.equipment.name}</CardTitle>
                  <CardDescription>
                    {eq.equipment.manufacturer} {eq.equipment.model}
                    {eq.equipment.serialNumber && ` - SN: ${eq.equipment.serialNumber}`}
                  </CardDescription>
                </div>
                {eq.summary.complianceStatus === 'OK' ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    I ORDEN
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white">
                    <XCircle className="mr-1 h-4 w-4" />
                    MANGLER
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Utstyrsinformasjon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Kategori:</span>
                  <div className="font-medium">{eq.equipment.category}</div>
                </div>
                <div>
                  <span className="text-gray-500">Plassering:</span>
                  <div className="font-medium">{eq.equipment.location || '-'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Min. nivå:</span>
                  <div className="font-medium">{eq.equipment.minimumTrainingLevel}</div>
                </div>
                <div>
                  <span className="text-gray-500">Gyldighet:</span>
                  <div className="font-medium">
                    {eq.equipment.trainingValidityDays ? `${eq.equipment.trainingValidityDays} dager` : 'Evig'}
                  </div>
                </div>
              </div>

              {/* Sertifiserte brukere */}
              <div>
                <h4 className="font-semibold mb-2">
                  Sertifiserte brukere ({eq.certifiedUsers.length})
                </h4>
                {eq.certifiedUsers.length === 0 ? (
                  <div className="text-center py-4 text-red-600 font-medium bg-red-50 rounded-lg">
                    ⚠️ Ingen aktive sertifiseringer - Utstyret kan ikke brukes!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Navn</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Nivå</TableHead>
                        <TableHead>Sertifisert av</TableHead>
                        <TableHead>Dato</TableHead>
                        <TableHead>Utløper</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eq.certifiedUsers.map((user: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{user.email}</div>
                              {user.phone && <div>{user.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.level}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.certifiedBy}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(user.certificationDate), 'PP', { locale: nb })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.expiresAt ? (
                              format(new Date(user.expiresAt), 'PP', { locale: nb })
                            ) : (
                              'Ingen utløp'
                            )}
                          </TableCell>
                          <TableCell>
                            {user.daysUntilExpiry === null ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Aktiv
                              </Badge>
                            ) : user.daysUntilExpiry > 30 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Aktiv
                              </Badge>
                            ) : user.daysUntilExpiry > 0 ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                Utløper snart
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                Utløpt
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Siste opplæring */}
              {eq.lastTraining && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Siste opplæringsøkt</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tittel:</span>
                      <div className="font-medium">{eq.lastTraining.title}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Leverandør:</span>
                      <div className="font-medium">{eq.lastTraining.provider}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Dato:</span>
                      <div className="font-medium">
                        {format(new Date(eq.lastTraining.date), 'PP', { locale: nb })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Deltakere:</span>
                      <div className="font-medium">{eq.lastTraining.participants}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sikkerhetsinformasjon */}
              {(eq.safety.riskAssessment || eq.safety.safetyInstructions || eq.safety.emergencyProcedures) && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Sikkerhetsinformasjon</h4>
                  <div className="space-y-2 text-sm">
                    {eq.safety.riskAssessment && (
                      <div>
                        <span className="font-medium text-gray-700">Risikovurdering:</span>
                        <p className="text-gray-600">{eq.safety.riskAssessment}</p>
                      </div>
                    )}
                    {eq.safety.safetyInstructions && (
                      <div>
                        <span className="font-medium text-gray-700">Sikkerhetsinstruksjoner:</span>
                        <p className="text-gray-600">{eq.safety.safetyInstructions}</p>
                      </div>
                    )}
                    {eq.safety.emergencyProcedures && (
                      <div>
                        <span className="font-medium text-gray-700">Nødprosedyrer:</span>
                        <p className="text-gray-600">{eq.safety.emergencyProcedures}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signatur-seksjon */}
      <Card className="print:break-before-page print:shadow-none print:border-2">
        <CardHeader>
          <CardTitle>Signatur og godkjenning</CardTitle>
          <CardDescription>
            Denne rapporten bekrefter at bedriften har dokumentert opplæring i henhold til Arbeidsmiljøloven § 4-5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="border-t-2 border-gray-300 pt-2 mt-16">
                <p className="text-sm text-gray-600">HMS-ansvarlig / Daglig leder</p>
                <p className="text-xs text-gray-500 mt-1">Dato og signatur</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-300 pt-2 mt-16">
                <p className="text-sm text-gray-600">Inspektør (Arbeidstilsynet)</p>
                <p className="text-xs text-gray-500 mt-1">Dato og signatur</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

