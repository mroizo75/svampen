'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface AddEquipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const EQUIPMENT_CATEGORIES = [
  'Polérmaskin',
  'Vaskeutstyr',
  'Løfteutstyr',
  'Elektrisk verktøy',
  'Kjemikalie',
  'Sikkerhetsutstyr',
  'Annet',
]

const TRAINING_LEVELS = [
  { value: 'BASIC', label: 'Grunnleggende' },
  { value: 'INTERMEDIATE', label: 'Selvstendig' },
  { value: 'ADVANCED', label: 'Avansert' },
  { value: 'TRAINER', label: 'Opplærer' },
  { value: 'SUPPLIER', label: 'Leverandør' },
]

export function AddEquipmentDialog({ open, onOpenChange, onSuccess }: AddEquipmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    description: '',
    location: '',
    purchaseDate: '',
    warrantyExpiresAt: '',
    requiresTraining: true,
    trainingValidityDays: '',
    minimumTrainingLevel: 'BASIC',
    riskAssessment: '',
    safetyInstructions: '',
    emergencyProcedures: '',
    requiresInspection: false,
    nextInspectionDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          trainingValidityDays: formData.trainingValidityDays ? parseInt(formData.trainingValidityDays) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Kunne ikke opprette utstyr')
      }

      toast.success('Utstyr opprettet', {
        description: 'Utstyret ble lagt til i systemet',
      })

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        description: '',
        location: '',
        purchaseDate: '',
        warrantyExpiresAt: '',
        requiresTraining: true,
        trainingValidityDays: '',
        minimumTrainingLevel: 'BASIC',
        riskAssessment: '',
        safetyInstructions: '',
        emergencyProcedures: '',
        requiresInspection: false,
        nextInspectionDate: '',
      })
    } catch (error: any) {
      toast.error('Feil', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til nytt utstyr</DialogTitle>
          <DialogDescription>
            Registrer utstyr som krever opplæring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grunnleggende info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="F.eks. Polérmaskin Flex PE14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Produsent</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="F.eks. Flex"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modell</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="F.eks. PE14-2-150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serienummer</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Serienummer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaljert beskrivelse av utstyret..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Plassering</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="F.eks. Verksted, Hylle 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Kjøpsdato</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Opplæringskrav */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Opplæringskrav</h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresTraining"
                checked={formData.requiresTraining}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresTraining: checked })}
              />
              <Label htmlFor="requiresTraining">Krever opplæring</Label>
            </div>

            {formData.requiresTraining && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumTrainingLevel">Minimum opplæringsnivå</Label>
                  <Select
                    value={formData.minimumTrainingLevel}
                    onValueChange={(value) => setFormData({ ...formData, minimumTrainingLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainingValidityDays">Gyldighet (dager)</Label>
                  <Input
                    id="trainingValidityDays"
                    type="number"
                    value={formData.trainingValidityDays}
                    onChange={(e) => setFormData({ ...formData, trainingValidityDays: e.target.value })}
                    placeholder="365 (la stå tom for evig)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sikkerhetsinformasjon */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Sikkerhetsinformasjon</h3>

            <div className="space-y-2">
              <Label htmlFor="riskAssessment">Risikovurdering</Label>
              <Textarea
                id="riskAssessment"
                value={formData.riskAssessment}
                onChange={(e) => setFormData({ ...formData, riskAssessment: e.target.value })}
                placeholder="Identifiserte risikoer..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safetyInstructions">Sikkerhetsinstruksjoner</Label>
              <Textarea
                id="safetyInstructions"
                value={formData.safetyInstructions}
                onChange={(e) => setFormData({ ...formData, safetyInstructions: e.target.value })}
                placeholder="Hvordan bruke utstyret sikkert..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyProcedures">Nødprosedyrer</Label>
              <Textarea
                id="emergencyProcedures"
                value={formData.emergencyProcedures}
                onChange={(e) => setFormData({ ...formData, emergencyProcedures: e.target.value })}
                placeholder="Hva gjøres ved ulykke..."
                rows={2}
              />
            </div>
          </div>

          {/* Inspeksjon */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="requiresInspection"
                checked={formData.requiresInspection}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresInspection: checked })}
              />
              <Label htmlFor="requiresInspection">Krever periodisk inspeksjon</Label>
            </div>

            {formData.requiresInspection && (
              <div className="space-y-2">
                <Label htmlFor="nextInspectionDate">Neste inspeksjon</Label>
                <Input
                  id="nextInspectionDate"
                  type="date"
                  value={formData.nextInspectionDate}
                  onChange={(e) => setFormData({ ...formData, nextInspectionDate: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oppretter...' : 'Opprett utstyr'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

