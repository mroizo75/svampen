'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2, AlertCircle, Car, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VehicleConfig {
  id: string
  vehicleTypeId: string
  vehicleInfo: string
  vehicleNotes: string
  services: {
    serviceId: string
    quantity: number
  }[]
}

interface BookingTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  services: any[]
  vehicleTypes: any[]
  template?: any // For redigering
  onSuccess: () => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Søndag' },
  { value: 1, label: 'Mandag' },
  { value: 2, label: 'Tirsdag' },
  { value: 3, label: 'Onsdag' },
  { value: 4, label: 'Torsdag' },
  { value: 5, label: 'Fredag' },
  { value: 6, label: 'Lørdag' },
]

export function BookingTemplateDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  services,
  vehicleTypes,
  template,
  onSuccess,
}: BookingTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // Mandag som default
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [time, setTime] = useState('09:00')
  const [vehicles, setVehicles] = useState<VehicleConfig[]>([])
  const [defaultNotes, setDefaultNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [generateDaysAhead, setGenerateDaysAhead] = useState(30)

  // Last inn eksisterende template for redigering
  useEffect(() => {
    if (template) {
      setName(template.name || '')
      setDescription(template.description || '')
      setFrequency(template.frequency || 'WEEKLY')
      setDayOfWeek(template.dayOfWeek ?? 1)
      setDayOfMonth(template.dayOfMonth ?? 1)
      setTime(template.time || '09:00')
      setDefaultNotes(template.defaultNotes || '')
      setIsActive(template.isActive ?? true)
      setAutoGenerate(template.autoGenerate ?? false)
      setGenerateDaysAhead(template.generateDaysAhead ?? 30)

      // Parse vehiclesConfig
      if (template.vehiclesConfig) {
        const config = typeof template.vehiclesConfig === 'string' 
          ? JSON.parse(template.vehiclesConfig) 
          : template.vehiclesConfig
        setVehicles(config.map((v: any) => ({
          ...v,
          id: v.id || Math.random().toString(36).substr(2, 9),
        })))
      }
    } else {
      // Reset for ny mal
      setName('')
      setDescription('')
      setFrequency('WEEKLY')
      setDayOfWeek(1)
      setDayOfMonth(1)
      setTime('09:00')
      setVehicles([])
      setDefaultNotes('')
      setIsActive(true)
      setAutoGenerate(false)
      setGenerateDaysAhead(30)
    }
  }, [template, open])

  const handleAddVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        id: Math.random().toString(36).substr(2, 9),
        vehicleTypeId: vehicleTypes[0]?.id || '',
        vehicleInfo: '',
        vehicleNotes: '',
        services: [],
      },
    ])
  }

  const handleRemoveVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id))
  }

  const handleUpdateVehicle = (id: string, field: string, value: any) => {
    setVehicles(vehicles.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ))
  }

  const handleAddService = (vehicleId: string) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId
        ? {
            ...v,
            services: [
              ...v.services,
              { serviceId: services[0]?.id || '', quantity: 1 },
            ],
          }
        : v
    ))
  }

  const handleRemoveService = (vehicleId: string, serviceIndex: number) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId
        ? {
            ...v,
            services: v.services.filter((_, i) => i !== serviceIndex),
          }
        : v
    ))
  }

  const handleUpdateService = (vehicleId: string, serviceIndex: number, field: string, value: any) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId
        ? {
            ...v,
            services: v.services.map((s, i) => 
              i === serviceIndex ? { ...s, [field]: value } : s
            ),
          }
        : v
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validering
      if (!name.trim()) {
        setError('Navn er påkrevd')
        setLoading(false)
        return
      }

      if (vehicles.length === 0) {
        setError('Legg til minst ett kjøretøy')
        setLoading(false)
        return
      }

      for (const vehicle of vehicles) {
        if (!vehicle.vehicleTypeId) {
          setError('Velg kjøretøytype for alle kjøretøy')
          setLoading(false)
          return
        }
        if (vehicle.services.length === 0) {
          setError('Legg til minst én tjeneste per kjøretøy')
          setLoading(false)
          return
        }
      }

      // Forbered data
      const vehiclesConfig = vehicles.map(v => ({
        vehicleTypeId: v.vehicleTypeId,
        vehicleInfo: v.vehicleInfo,
        vehicleNotes: v.vehicleNotes,
        services: v.services,
      }))

      const data = {
        companyId,
        name: name.trim(),
        description: description.trim() || null,
        frequency,
        dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null,
        dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : null,
        time,
        vehiclesConfig,
        defaultNotes: defaultNotes.trim() || null,
        isActive,
        autoGenerate,
        generateDaysAhead,
      }

      const url = template
        ? `/api/admin/booking-templates/${template.id}`
        : '/api/admin/booking-templates'

      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const result = await response.json()
        setError(result.message || 'Noe gikk galt')
      }
    } catch (err) {
      setError('En feil oppstod')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Rediger booking-mal' : 'Ny booking-mal'}
          </DialogTitle>
          <DialogDescription>
            Opprett en mal for gjentakende bookinger for <strong>{companyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grunnleggende info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Navn på mal *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. 'Mandag morgen vask'"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse av malen"
                rows={2}
              />
            </div>
          </div>

          {/* Tidspunkt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tidspunkt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frekvens *</Label>
                  <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Ukentlig</SelectItem>
                      <SelectItem value="MONTHLY">Månedlig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time">Klokkeslett *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {frequency === 'WEEKLY' && (
                <div>
                  <Label htmlFor="dayOfWeek">Ukedag *</Label>
                  <Select 
                    value={dayOfWeek.toString()} 
                    onValueChange={(v) => setDayOfWeek(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {frequency === 'MONTHLY' && (
                <div>
                  <Label htmlFor="dayOfMonth">Dag i måneden *</Label>
                  <Select 
                    value={dayOfMonth.toString()} 
                    onValueChange={(v) => setDayOfMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}. dag i måneden
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kjøretøy og tjenester */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Kjøretøy og tjenester *</span>
                <Button type="button" onClick={handleAddVehicle} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til kjøretøy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicles.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ingen kjøretøy lagt til. Klikk "Legg til kjøretøy" for å starte.
                </p>
              )}

              {vehicles.map((vehicle, vIndex) => (
                <Card key={vehicle.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center">
                        <Car className="mr-2 h-4 w-4" />
                        Kjøretøy {vIndex + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVehicle(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Kjøretøytype *</Label>
                        <Select
                          value={vehicle.vehicleTypeId}
                          onValueChange={(v) => handleUpdateVehicle(vehicle.id, 'vehicleTypeId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg type" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map(vt => (
                              <SelectItem key={vt.id} value={vt.id}>
                                {vt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Regnr / Info</Label>
                        <Input
                          value={vehicle.vehicleInfo}
                          onChange={(e) => handleUpdateVehicle(vehicle.id, 'vehicleInfo', e.target.value)}
                          placeholder="Regnr, modell, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notater</Label>
                      <Input
                        value={vehicle.vehicleNotes}
                        onChange={(e) => handleUpdateVehicle(vehicle.id, 'vehicleNotes', e.target.value)}
                        placeholder="Spesielle instruksjoner"
                      />
                    </div>

                    {/* Tjenester for dette kjøretøyet */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Tjenester *
                        </Label>
                        <Button
                          type="button"
                          onClick={() => handleAddService(vehicle.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Legg til tjeneste
                        </Button>
                      </div>

                      {vehicle.services.length === 0 && (
                        <p className="text-xs text-gray-500">Ingen tjenester valgt</p>
                      )}

                      {vehicle.services.map((service, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-2">
                          <Select
                            value={service.serviceId}
                            onValueChange={(v) => handleUpdateService(vehicle.id, sIndex, 'serviceId', v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Velg tjeneste" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => handleUpdateService(vehicle.id, sIndex, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                            placeholder="Ant."
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(vehicle.id, sIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Notater og innstillinger */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultNotes">Standard notater</Label>
              <Textarea
                id="defaultNotes"
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                placeholder="Notater som fylles inn automatisk på alle bookinger"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(!!checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktiv mal
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerate"
                checked={autoGenerate}
                onCheckedChange={(checked) => setAutoGenerate(!!checked)}
              />
              <Label htmlFor="autoGenerate" className="cursor-pointer">
                Auto-generer bookinger (kommer senere)
              </Label>
            </div>

            {autoGenerate && (
              <div>
                <Label htmlFor="generateDaysAhead">Dager fremover</Label>
                <Input
                  id="generateDaysAhead"
                  type="number"
                  min="1"
                  max="365"
                  value={generateDaysAhead}
                  onChange={(e) => setGenerateDaysAhead(parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hvor mange dager fremover skal bookinger genereres automatisk
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? 'Oppdater mal' : 'Opprett mal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

