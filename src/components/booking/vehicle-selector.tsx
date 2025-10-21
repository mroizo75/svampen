'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Car, Info } from 'lucide-react'

interface VehicleType {
  id: string
  name: string
  description: string
}

interface VehicleSelectorProps {
  vehicleTypes: VehicleType[]
  selectedVehicleTypeId: string
  vehicleInfo: string
  vehicleNotes: string
  onVehicleTypeChange: (vehicleTypeId: string) => void
  onVehicleInfoChange: (vehicleInfo: string) => void
  onVehicleNotesChange: (vehicleNotes: string) => void
}

export function VehicleSelector({
  vehicleTypes,
  selectedVehicleTypeId,
  vehicleInfo,
  vehicleNotes,
  onVehicleTypeChange,
  onVehicleInfoChange,
  onVehicleNotesChange,
}: VehicleSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Vehicle Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="vehicleType" className="flex items-center">
          <Car className="mr-2 h-4 w-4" />
          Kjøretøy type *
        </Label>
        <Select value={selectedVehicleTypeId} onValueChange={onVehicleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Velg type kjøretøy" />
          </SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((vehicleType) => (
              <SelectItem key={vehicleType.id} value={vehicleType.id}>
                <div>
                  <div className="font-medium">{vehicleType.name}</div>
                  {vehicleType.description && (
                    <div className="text-sm text-gray-500">{vehicleType.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-2">
        <Label htmlFor="vehicleInfo">
          Kjøretøy informasjon (valgfritt)
        </Label>
        <Input
          id="vehicleInfo"
          value={vehicleInfo}
          onChange={(e) => onVehicleInfoChange(e.target.value)}
          placeholder="F.eks. BMW X5, reg.nr: AB12345, hvit farge"
        />
        <p className="text-xs text-gray-500 flex items-center">
          <Info className="mr-1 h-3 w-3" />
          Bilmerke, modell, registreringsnummer eller andre detaljer
        </p>
      </div>

      {/* Vehicle Notes */}
      <div className="space-y-2">
        <Label htmlFor="vehicleNotes">
          Spesielle merknader for dette kjøretøyet (valgfritt)
        </Label>
        <Textarea
          id="vehicleNotes"
          value={vehicleNotes}
          onChange={(e) => onVehicleNotesChange(e.target.value)}
          placeholder="F.eks. ekstra skitten, hundehår, behov for spesiell behandling..."
          rows={2}
        />
      </div>
    </div>
  )
}