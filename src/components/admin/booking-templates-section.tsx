'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar, Clock, Edit, Trash2, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { BookingTemplateDialog } from './booking-template-dialog'
import { useRouter } from 'next/navigation'

interface BookingTemplatesSectionProps {
  companyId: string
  companyName: string
  initialTemplates: any[]
  services: any[]
  vehicleTypes: any[]
}

export function BookingTemplatesSection({
  companyId,
  companyName,
  initialTemplates,
  services,
  vehicleTypes,
}: BookingTemplatesSectionProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generationResult, setGenerationResult] = useState<{ templateId: string; message: string } | null>(null)

  const handleRefresh = () => {
    router.refresh()
    // Hent oppdaterte templates
    fetch(`/api/admin/booking-templates?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error('Error refreshing templates:', err))
  }

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  const handleEdit = (template: any) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne malen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/booking-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        alert('Kunne ikke slette malen')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('En feil oppstod')
    }
  }

  const handleGenerate = async (templateId: string) => {
    setGenerating(templateId)
    setGenerationResult(null)

    // Spør brukeren hvor mange dager fremover de vil generere
    const daysAheadInput = prompt('Hvor mange dager fremover skal bookinger genereres?', '120')
    if (!daysAheadInput) {
      setGenerating(null)
      return
    }

    const daysAhead = parseInt(daysAheadInput)
    if (isNaN(daysAhead) || daysAhead < 1) {
      alert('Vennligst oppgi et gyldig tall')
      setGenerating(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/booking-templates/${templateId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead }),
      })

      const data = await response.json()

      if (response.ok) {
        setGenerationResult({
          templateId,
          message: data.message || 'Bookinger generert',
        })
        router.refresh()
      } else {
        alert(data.message || 'Kunne ikke generere bookinger')
      }
    } catch (error) {
      console.error('Error generating bookings:', error)
      alert('En feil oppstod')
    } finally {
      setGenerating(null)
    }
  }

  const getFrequencyText = (template: any) => {
    if (template.frequency === 'WEEKLY') {
      const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
      return `Hver ${days[template.dayOfWeek]} kl. ${template.time}`
    } else if (template.frequency === 'MONTHLY') {
      return `Den ${template.dayOfMonth}. hver måned kl. ${template.time}`
    }
    return 'Ukjent frekvens'
  }

  const getVehiclesSummary = (template: any) => {
    const config = typeof template.vehiclesConfig === 'string'
      ? JSON.parse(template.vehiclesConfig)
      : template.vehiclesConfig

    const vehicleCount = config.length
    const serviceCount = config.reduce((sum: number, v: any) => sum + (v.services?.length || 0), 0)

    return `${vehicleCount} kjøretøy, ${serviceCount} tjenester`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking-maler</CardTitle>
              <CardDescription>
                Gjentakende bookinger for faste avtaler
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ny mal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generationResult && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {generationResult.message}
              </AlertDescription>
            </Alert>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Ingen booking-maler opprettet enda</p>
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Opprett første mal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(template => (
                <Card key={template.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inaktiv</Badge>
                          )}
                          {template.autoGenerate && (
                            <Badge className="bg-blue-100 text-blue-800">Auto-generering</Badge>
                          )}
                        </div>

                        {template.description && (
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4" />
                            <span>{getFrequencyText(template)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4" />
                            <span>{getVehiclesSummary(template)}</span>
                          </div>
                        </div>

                        {template.lastGeneratedDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Sist generert: {new Date(template.lastGeneratedDate).toLocaleDateString('nb-NO')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(template.id)}
                          disabled={!template.isActive || generating === template.id}
                        >
                          {generating === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><Play className="mr-2 h-4 w-4" /> Generer</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BookingTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        companyName={companyName}
        services={services}
        vehicleTypes={vehicleTypes}
        template={selectedTemplate}
        onSuccess={handleRefresh}
      />
    </>
  )
}

