'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal,
  Car,
  Plus,
  Edit,
  Eye,
  Trash2,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { AddVehicleTypeDialog } from '@/components/admin/add-vehicle-type-dialog'
import { AddServiceDialog } from '@/components/admin/add-service-dialog'
import { EditServiceDialog } from '@/components/admin/edit-service-dialog'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ServicePrice {
  id: string
  price: number
  vehicleType: {
    id: string
    name: string
  }
}

interface Service {
  id: string
  name: string
  description: string
  duration: number
  category: 'MAIN' | 'ADDON' | 'SPECIAL'
  isActive: boolean
  isAdminOnly: boolean
  servicePrices: ServicePrice[]
  stats: {
    totalBookings: number
    completedBookings: number
    totalRevenue: number
  }
}

interface VehicleType {
  id: string
  name: string
  description: string | null
  createdAt: Date
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, vehicleTypesRes] = await Promise.all([
        fetch('/api/admin/services-with-stats'),
        fetch('/api/vehicle-types'),
      ])

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }

      if (vehicleTypesRes.ok) {
        const vehicleTypesData = await vehicleTypesRes.json()
        setVehicleTypes(vehicleTypesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          isActive: !service.isActive,
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const handleDelete = async (service: Service) => {
    const bookingWarning = service.stats.totalBookings > 0 
      ? `\n\nADVARSEL: Denne tjenesten er brukt i ${service.stats.totalBookings} bestillinger.` 
      : ''
    
    if (!confirm(`Er du sikker på at du vil slette tjenesten "${service.name}"?${bookingWarning}`)) {
      return
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.message || 'Kunne ikke slette tjeneste')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('En feil oppstod ved sletting')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Laster tjenester...</p>
        </div>
      </div>
    )
  }

  const activeServices = services.filter(s => s.isActive).length
  const totalRevenue = services.reduce((sum, s) => sum + s.stats.totalRevenue, 0)
  const totalBookings = services.reduce((sum, s) => sum + s.stats.totalBookings, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tjenester</h1>
          <p className="text-gray-600">Administrer tjenester, priser og kjøretøy typer</p>
        </div>
        <div className="flex space-x-2">
          <AddVehicleTypeDialog />
          <AddServiceDialog vehicleTypes={vehicleTypes} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive tjenester</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-muted-foreground">
              av {services.length} totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total omsetning</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {totalRevenue.toLocaleString('nb-NO')}</div>
            <p className="text-xs text-muted-foreground">
              Fra alle tjenester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale bestillinger</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Alle statuser
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kjøretøy typer</CardTitle>
            <Car className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Støttede typer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle tjenester</CardTitle>
          <CardDescription>Administrer tjenester og deres priser</CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen tjenester funnet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tjeneste</TableHead>
                    <TableHead>Varighet</TableHead>
                    <TableHead>Prisrange</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bestillinger</TableHead>
                    <TableHead>Omsetning</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => {
                    const prices = service.servicePrices.map(sp => Number(sp.price))
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)

                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{service.name}</span>
                              {service.isAdminOnly && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                  Kun admin
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {service.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-gray-400" />
                            {service.duration} min
                          </div>
                        </TableCell>
                        <TableCell>
                          {prices.length > 0 ? (
                            <div>
                              <div className="font-medium">
                                kr {minPrice.toLocaleString('nb-NO')}
                                {minPrice !== maxPrice && ` - ${maxPrice.toLocaleString('nb-NO')}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {service.servicePrices.length} prisnivå
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Ingen priser</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.stats.totalBookings}</div>
                            <div className="text-sm text-gray-500">
                              {service.stats.completedBookings} fullført
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          kr {service.stats.totalRevenue.toLocaleString('nb-NO')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingService(service)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Rediger tjeneste
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                                {service.isActive ? "Deaktiver" : "Aktiver"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(service)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Slett tjeneste
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Types */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kjøretøy typer</CardTitle>
              <CardDescription>Administrer støttede kjøretøy typer</CardDescription>
            </div>
            <AddVehicleTypeDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleTypes.map((vehicleType) => (
              <Card key={vehicleType.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{vehicleType.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {vehicleType.description && (
                    <p className="text-sm text-gray-600">{vehicleType.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Opprettet {new Date(vehicleType.createdAt).toLocaleDateString('nb-NO')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingService && (
        <EditServiceDialog
          service={editingService}
          vehicleTypes={vehicleTypes}
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null)
            }
          }}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
