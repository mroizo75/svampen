'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ServicePriceInput {
  id: string
  vehicleTypeId: string
  vehicleTypeName: string
  price: number
}

type ServiceCategoryOption = 'MAIN' | 'ADDON' | 'SPECIAL' | 'DEALER'

interface ServiceFormService {
  id: string
  name: string
  description: string
  duration: number
  category: ServiceCategoryOption
  isActive: boolean
  isAdminOnly: boolean
  servicePrices: ServicePriceInput[]
}

interface VehicleTypeOption {
  id: string
  name: string
}

interface EditServiceFormProps {
  service: ServiceFormService
  vehicleTypes: VehicleTypeOption[]
}

export function EditServiceForm({ service, vehicleTypes }: EditServiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description,
    duration: service.duration.toString(),
    category: service.category,
    isActive: service.isActive,
    isAdminOnly: service.isAdminOnly,
  })

  const initialPriceMap = useMemo(() => {
    const map: Record<string, string> = {}
    service.servicePrices.forEach((price) => {
      map[price.vehicleTypeId] = price.price.toString()
    })
    return map
  }, [service.servicePrices])

  const [prices, setPrices] = useState<Record<string, string>>(initialPriceMap)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const validPrices = Object.entries(prices).filter(
        ([, price]) => price && Number(price) > 0
      )

      if (validPrices.length === 0) {
        throw new Error('Du må sette minst én pris')
      }

      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: Number(formData.duration),
          prices: Object.fromEntries(
            validPrices.map(([vehicleTypeId, price]) => [vehicleTypeId, Number(price)])
          ),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Kunne ikke oppdatere tjeneste')
      }

      setSuccess('Tjenesten ble oppdatert.')
      setTimeout(() => {
        router.push('/admin/tjenester')
        router.refresh()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Varighet (minutter) *</Label>
          <Input
            id="duration"
            type="number"
            min="0"
            required
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse *</Label>
        <Textarea
          id="description"
          rows={4}
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value as ServiceCategoryOption })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN">Hovedpakke</SelectItem>
              <SelectItem value="ADDON">Tillegg</SelectItem>
              <SelectItem value="SPECIAL">Spesial</SelectItem>
              <SelectItem value="DEALER">Forhandler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aktiv</Label>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {formData.isActive ? 'Aktiv' : 'Inaktiv'}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Kun for admin</Label>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Switch
              id="isAdminOnly"
              checked={formData.isAdminOnly}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isAdminOnly: checked })
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isAdminOnly" className="cursor-pointer">
              Skjul for kunder
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Priser per kjøretøy type *</Label>
          <p className="text-sm text-gray-500">
            Sett minst én pris (i NOK).
          </p>
        </div>
        <div className="space-y-3">
          {vehicleTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-4">
              <Label className="w-40 text-sm font-medium">{type.name}</Label>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-500">kr</span>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={prices[type.id] ?? ''}
                  onChange={(e) =>
                    setPrices({ ...prices, [type.id]: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/tjenester')}
          disabled={isSubmitting}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lagrer...
            </>
          ) : (
            'Lagre endringer'
          )}
        </Button>
      </div>
    </form>
  )
}


