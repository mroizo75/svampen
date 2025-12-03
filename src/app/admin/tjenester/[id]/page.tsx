import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditServiceForm } from '@/components/admin/edit-service-form'

async function getService(id: string) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      servicePrices: {
        include: {
          vehicleType: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!service) {
    return null
  }

  return {
    ...service,
    servicePrices: service.servicePrices.map((price) => ({
      id: price.id,
      vehicleTypeId: price.vehicleTypeId,
      vehicleTypeName: price.vehicleType.name,
      price: Number(price.price),
    })),
  }
}

async function getVehicleTypes() {
  const vehicleTypes = await prisma.vehicleType.findMany({
    orderBy: { name: 'asc' },
  })

  return vehicleTypes.map((type) => ({
    id: type.id,
    name: type.name,
  }))
}

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [service, vehicleTypes] = await Promise.all([
    getService(id),
    getVehicleTypes(),
  ])

  if (!service) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/tjenester">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake til tjenester
            </Link>
          </Button>
        <div className="text-right">
          <p className="text-sm text-gray-500">Rediger tjeneste</p>
          <h1 className="text-2xl font-semibold">{service.name}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Tjenesteinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditServiceForm service={service} vehicleTypes={vehicleTypes} />
        </CardContent>
      </Card>
    </div>
  )
}


