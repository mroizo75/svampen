import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AdminBookingWizard from '@/components/admin/admin-booking-wizard'

async function getBookingData() {
  const [services, vehicleTypes] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      include: {
        servicePrices: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.vehicleType.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  // Konverter Decimal til number for Client Component
  const serializedServices = services.map(service => ({
    ...service,
    servicePrices: service.servicePrices.map(sp => ({
      ...sp,
      price: Number(sp.price),
    })),
  }))

  return { services: serializedServices, vehicleTypes }
}

export default async function NewBookingPage() {
  const { services, vehicleTypes } = await getBookingData()
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/bestillinger">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ny bestilling</h1>
          <p className="text-gray-600">Opprett booking på vegne av kunde</p>
        </div>
      </div>

      {/* Booking Wizard */}
      <Card>
        <CardHeader>
          <CardTitle>Bookingdetaljer</CardTitle>
          <CardDescription>
            Fyll ut informasjonen nedenfor for å opprette en booking for en kunde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminBookingWizard 
            services={services} 
            vehicleTypes={vehicleTypes}
          />
        </CardContent>
      </Card>
    </div>
  )
}

