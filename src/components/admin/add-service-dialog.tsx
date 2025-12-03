'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2, AlertCircle } from 'lucide-react'

interface VehicleType {
  id: string
  name: string
}

interface AddServiceDialogProps {
  vehicleTypes: VehicleType[]
  onSuccess?: () => void
}

export function AddServiceDialog({ vehicleTypes, onSuccess }: AddServiceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    category: 'MAIN' as 'MAIN' | 'ADDON' | 'SPECIAL',
    isAdminOnly: false,
  })

  // Priser for hver kjøretøy type
  const [prices, setPrices] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Valider at minst én pris er satt
      const validPrices = Object.entries(prices).filter(([_, price]) => price && Number(price) > 0)
      
      if (validPrices.length === 0) {
        throw new Error('Du må sette minst én pris')
      }

      const response = await fetch('/api/services', {
        method: 'POST',
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
        throw new Error(data.error || 'Kunne ikke opprette tjeneste')
      }

      // Lukk dialog og reset form
      setFormData({ name: '', description: '', duration: '', category: 'MAIN', isAdminOnly: false })
      setPrices({})
      setOpen(false)
      
      // Kall success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ny tjeneste
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Legg til ny tjeneste</DialogTitle>
            <DialogDescription>
              Opprett en ny tjeneste med priser for forskjellige kjøretøy typer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tjenestenavn *</Label>
              <Input
                id="name"
                placeholder="f.eks. Eksklusiv pakke, Seterens, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse *</Label>
              <Textarea
                id="description"
                placeholder="Beskriv hva tjenesten inkluderer"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Varighet (minutter) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: 'MAIN' | 'ADDON' | 'SPECIAL') =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAIN">Hovedpakke</SelectItem>
                    <SelectItem value="ADDON">Tilleggstjeneste</SelectItem>
                    <SelectItem value="SPECIAL">Spesialtjeneste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t pt-4 pb-2">
              <Checkbox
                id="isAdminOnly"
                checked={formData.isAdminOnly}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isAdminOnly: checked === true })
                }
                disabled={isLoading}
              />
              <Label 
                htmlFor="isAdminOnly" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Kun for admin (bedriftsavtaler/spesialpriser)
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6 -mt-2">
              Tjenester merket som "Kun for admin" vises ikke for vanlige kunder på booking-siden
            </p>

            <div className="space-y-3 border-t pt-4">
              <Label>Priser per kjøretøy type *</Label>
              <p className="text-sm text-gray-500">
                Sett priser for hver kjøretøy type. Minst én pris må være satt.
              </p>
              <div className="space-y-2">
                {vehicleTypes.map((vehicleType) => (
                  <div key={vehicleType.id} className="flex items-center gap-3">
                    <Label htmlFor={`price-${vehicleType.id}`} className="min-w-[150px]">
                      {vehicleType.name}
                    </Label>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-500">kr</span>
                      <Input
                        id={`price-${vehicleType.id}`}
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={prices[vehicleType.id] || ''}
                        onChange={(e) =>
                          setPrices({ ...prices, [vehicleType.id]: e.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.duration}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oppretter...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Opprett
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

