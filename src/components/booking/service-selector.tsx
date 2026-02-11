'use client'

import { useState, useEffect } from 'react'
import { priceWithVat } from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Minus, 
  Car, 
  Sparkles, 
  Wrench,
  Clock,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  category: 'MAIN' | 'ADDON' | 'SPECIAL' | 'DEALER'
  isAdminOnly?: boolean
  servicePrices: Array<{
    id: string
    price: number
    vehicleTypeId: string
  }>
}

interface SelectedService {
  serviceId: string
  service?: Service
  quantity: number
  unitPrice: number
  totalPrice: number
  duration: number
}

interface ServiceSelectorProps {
  services: Service[]
  vehicleTypeId: string
  selectedServices: SelectedService[]
  onServicesChange: (services: SelectedService[]) => void
  isAdminBooking?: boolean
}

export function ServiceSelector({ 
  services, 
  vehicleTypeId, 
  selectedServices, 
  onServicesChange,
  isAdminBooking = false
}: ServiceSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'MAIN' | 'ADDON' | 'SPECIAL' | 'DEALER'>('MAIN')

  // Filtrer tjenester etter kategori OG om de har pris for valgt kjøretøy
  const hasValidPrice = (service: Service) => {
    const priceInfo = service.servicePrices.find(sp => sp.vehicleTypeId === vehicleTypeId)
    return priceInfo && Number(priceInfo.price) > 0
  }

  // Filtrer bort admin-only tjenester hvis ikke admin
  const availableServices = services.filter(s => !s.isAdminOnly || isAdminBooking)

  const mainServices = availableServices.filter(s => s.category === 'MAIN' && hasValidPrice(s))
  const addonServices = availableServices.filter(s => s.category === 'ADDON' && hasValidPrice(s))
  const specialServices = availableServices.filter(s => s.category === 'SPECIAL' && hasValidPrice(s))
  const dealerServices = availableServices.filter(s => s.category === 'DEALER' && hasValidPrice(s))

  const categories = [
    { key: 'MAIN', label: 'Hovedpakker', services: mainServices },
    { key: 'ADDON', label: 'Tilleggstjenester', services: addonServices },
    { key: 'SPECIAL', label: 'Spesialtjenester', services: specialServices },
    ...(isAdminBooking ? [{ key: 'DEALER', label: '🏢 Bilforhandler-pakker', services: dealerServices }] : []),
  ]

  // Auto-velg første tilgjengelige kategori hvis valgt kategori er tom
  useEffect(() => {
    const currentCategory = categories.find(c => c.key === selectedCategory)
    if (currentCategory && currentCategory.services.length === 0) {
      const firstAvailable = categories.find(c => c.services.length > 0)
      if (firstAvailable) {
        setSelectedCategory(firstAvailable.key as any)
      }
    }
  }, [vehicleTypeId, selectedCategory])

  const getServicePrice = (service: Service) => {
    const priceInfo = service.servicePrices.find(sp => sp.vehicleTypeId === vehicleTypeId)
    return Number(priceInfo?.price) || 0
  }

  const getDisplayPrice = (priceExclVat: number) => priceWithVat(priceExclVat)

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.serviceId === serviceId)
  }

  const getSelectedService = (serviceId: string) => {
    return selectedServices.find(s => s.serviceId === serviceId)
  }

  const addService = (service: Service) => {
    const unitPrice = Number(getServicePrice(service))
    if (unitPrice === 0) return

    const newService: SelectedService = {
      serviceId: service.id,
      service,
      quantity: 1,
      unitPrice: unitPrice,
      totalPrice: unitPrice,
      duration: service.duration,
    }

    onServicesChange([...selectedServices, newService])
  }

  const removeService = (serviceId: string) => {
    onServicesChange(selectedServices.filter(s => s.serviceId !== serviceId))
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) {
      removeService(serviceId)
      return
    }

    onServicesChange(
      selectedServices.map(s => 
        s.serviceId === serviceId 
          ? { ...s, quantity, totalPrice: Number(s.unitPrice) * Number(quantity) }
          : s
      )
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MAIN': return Car
      case 'ADDON': return Plus
      case 'SPECIAL': return Wrench
      default: return Car
    }
  }

  return (
    <div className="space-y-6">
      {/* Valgte tjenester */}
      {selectedServices.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              Valgte tjenester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedServices.map((selectedService) => (
                <div key={selectedService.serviceId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{selectedService.service?.name}</div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {Number(selectedService.duration)} min per stykk
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(selectedService.serviceId, selectedService.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{selectedService.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(selectedService.serviceId, selectedService.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right min-w-20">
                      <div className="font-semibold">kr {getDisplayPrice(selectedService.totalPrice).toLocaleString()}</div>
                      {selectedService.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          kr {getDisplayPrice(selectedService.unitPrice).toLocaleString()} × {selectedService.quantity}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">Inkl. mva</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(selectedService.serviceId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kategori faner */}
      <div className="flex space-x-2 border-b">
        {categories
          .filter(category => category.services.length > 0) // Skjul tomme kategorier
          .map((category) => {
            const IconComponent = getCategoryIcon(category.key)
            return (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key as any)}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  selectedCategory === category.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {category.label}
                <Badge variant="secondary" className="ml-2">
                  {category.services.length}
                </Badge>
              </button>
            )
          })}
      </div>

      {/* Tjeneste liste */}
      <div className="grid gap-4">
        {categories
          .find(c => c.key === selectedCategory)
          ?.services.map((service) => {
            const price = getServicePrice(service)
            const selected = isServiceSelected(service.id)

            return (
              <Card 
                key={service.id} 
                className={cn(
                  "cursor-pointer transition-colors",
                  selected 
                    ? "border-green-500 bg-green-50" 
                    : "hover:border-gray-300"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {service.name}
                        {selected && (
                          <Badge variant="default" className="ml-2 bg-green-600">
                            Valgt
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {service.description}
                      </CardDescription>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-blue-600">
                        kr {getDisplayPrice(price).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Inkl. mva</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {service.duration} min
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {price > 0 ? (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {selectedCategory === 'MAIN' && 'Hovedtjeneste'}
                        {selectedCategory === 'ADDON' && 'Tilleggstjeneste'}
                        {selectedCategory === 'SPECIAL' && 'Spesialtjeneste'}
                      </div>
                      {selected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="mr-2 h-3 w-3" />
                          Fjern
                        </Button>
                      ) : (
                        <Button
                          onClick={() => addService(service)}
                          size="sm"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Legg til
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      Ikke tilgjengelig for denne kjøretøy typen
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}