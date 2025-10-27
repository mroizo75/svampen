import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MultiBookingWizard } from '@/components/booking/multi-booking-wizard'

async function getBookingData() {
  const [services, vehicleTypes, settings] = await Promise.all([
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
    prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['business_hours_start', 'business_hours_end'],
        },
      },
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

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)

  return { 
    services: serializedServices, 
    vehicleTypes,
    businessHoursStart: settingsMap.business_hours_start || '08:00',
    businessHoursEnd: settingsMap.business_hours_end || '16:00',
  }
}

export default async function NewBookingPage() {
  const { services, vehicleTypes, businessHoursStart, businessHoursEnd } = await getBookingData()
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
      <MultiBookingWizard 
        services={services} 
        vehicleTypes={vehicleTypes as any}
        isAdminBooking={true}
        businessHoursStart={businessHoursStart}
        businessHoursEnd={businessHoursEnd}
      />
    </div>
  )
}

