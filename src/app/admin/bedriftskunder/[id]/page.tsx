import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Calendar, Clock, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { BookingTemplatesSection } from '@/components/admin/booking-templates-section'

async function getCompanyDetails(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contactPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        bookings: {
          take: 10,
          orderBy: {
            scheduledDate: 'desc',
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            invoices: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        bookingTemplates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!company) {
      return null
    }

    return {
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
      bookings: company.bookings.map(booking => ({
        ...booking,
        totalPrice: Number(booking.totalPrice),
      })),
    }
  } catch (error) {
    console.error('Error fetching company details:', error)
    return null
  }
}

async function getServicesAndVehicleTypes() {
  const [services, vehicleTypes] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.vehicleType.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return { services, vehicleTypes }
}

export default async function CompanyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [company, { services, vehicleTypes }] = await Promise.all([
    getCompanyDetails(id),
    getServicesAndVehicleTypes(),
  ])

  if (!company) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Venter'
      case 'CONFIRMED': return 'Bekreftet'
      case 'IN_PROGRESS': return 'Pågår'
      case 'COMPLETED': return 'Fullført'
      case 'CANCELLED': return 'Avbestilt'
      case 'NO_SHOW': return 'Ikke møtt'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/bedriftskunder">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {company.name}
            </h1>
            <p className="text-gray-600">
              {company.isActive ? (
                <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Inaktiv</Badge>
              )}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/bedriftskunder/${company.id}/edit`}>
            Rediger bedrift
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bedriftsinfo */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bedriftsinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.orgNumber && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Org.nr</p>
                    <p className="text-sm text-gray-900">{company.orgNumber}</p>
                  </div>
                </div>
              )}

              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Adresse</p>
                    <p className="text-sm text-gray-900">{company.address}</p>
                    {company.postalCode && company.city && (
                      <p className="text-sm text-gray-900">{company.postalCode} {company.city}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">E-post</p>
                  <p className="text-sm text-gray-900">{company.contactEmail}</p>
                </div>
              </div>

              {company.contactPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Telefon</p>
                    <p className="text-sm text-gray-900">{company.contactPhone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avtaledetaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.contractStartDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Avtalens startdato</p>
                    <p className="text-sm text-gray-900">{formatDate(company.contractStartDate)}</p>
                  </div>
                </div>
              )}

              {company.contractEndDate && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Avtalens sluttdato</p>
                    <p className="text-sm text-gray-900">{formatDate(company.contractEndDate)}</p>
                  </div>
                </div>
              )}

              {company.discountPercent > 0 && (
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rabatt</p>
                    <p className="text-sm text-green-600 font-semibold">{company.discountPercent}%</p>
                  </div>
                </div>
              )}

              {company.paymentTerms && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Betalingsvilkår</p>
                  <p className="text-sm text-gray-900">{company.paymentTerms}</p>
                </div>
              )}

              {company.invoiceEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Faktura e-post</p>
                  <p className="text-sm text-gray-900">{company.invoiceEmail}</p>
                </div>
              )}

              {company.specialTerms && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Spesielle vilkår</p>
                  <p className="text-sm text-gray-900">{company.specialTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {company.contactPerson && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kontaktperson</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{company.contactPerson.firstName} {company.contactPerson.lastName}</p>
                <p className="text-sm text-gray-600">{company.contactPerson.email}</p>
                {company.contactPerson.phone && (
                  <p className="text-sm text-gray-600">{company.contactPerson.phone}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hovedinnhold */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking-maler */}
          <BookingTemplatesSection
            companyId={company.id}
            companyName={company.name}
            initialTemplates={company.bookingTemplates}
            services={services}
            vehicleTypes={vehicleTypes}
          />

          {/* Fakturaer */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturaer</CardTitle>
              <CardDescription>Fakturaer fra Tripletex for denne bedriften</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Samle alle fakturaer fra alle bookinger
                const allInvoices = company.bookings
                  .flatMap(booking => 
                    booking.invoices.map(invoice => ({
                      ...invoice,
                      booking: {
                        id: booking.id,
                        scheduledDate: booking.scheduledDate,
                      },
                    }))
                  )
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                if (allInvoices.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Ingen fakturaer enda</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Fakturaer opprettes automatisk fra fullførte bookinger
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {allInvoices.map(invoice => {
                      const isPaid = invoice.status === 'PAID'
                      const isOverdue = invoice.status === 'OVERDUE'
                      const isSent = invoice.status === 'SENT'

                      return (
                        <div
                          key={invoice.id}
                          className={`border-2 rounded-lg p-4 ${
                            isPaid ? 'border-green-300 bg-green-50' : 
                            isOverdue ? 'border-red-300 bg-red-50' : 
                            'border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{invoice.invoiceNumber}</p>
                                <Badge className={
                                  isPaid ? 'bg-green-500' : 
                                  isOverdue ? 'bg-red-500' : 
                                  isSent ? 'bg-blue-500' : 
                                  'bg-gray-500'
                                }>
                                  {invoice.status === 'DRAFT' ? 'Utkast' :
                                   invoice.status === 'SENT' ? 'Sendt' :
                                   invoice.status === 'VIEWED' ? 'Sett' :
                                   invoice.status === 'PAID' ? 'Betalt' :
                                   invoice.status === 'OVERDUE' ? 'Forfalt' :
                                   invoice.status === 'CANCELLED' ? 'Kansellert' :
                                   invoice.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Booking: {formatDate(invoice.booking.scheduledDate)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Forfaller: {formatDate(invoice.dueDate)}
                              </p>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <Link
                                  href={`/api/invoices/${invoice.id}/download`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Last ned PDF
                                </Link>
                                {invoice.tripletexUrl && (
                                  <Link
                                    href={invoice.tripletexUrl}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Se i Tripletex
                                  </Link>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                {Number(invoice.totalAmount).toLocaleString('nb-NO')} kr
                              </p>
                              {invoice.paidDate && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✓ Betalt {formatDate(invoice.paidDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Siste bookinger */}
          <Card>
            <CardHeader>
              <CardTitle>Siste bookinger</CardTitle>
              <CardDescription>De 10 siste bookingene for denne bedriften</CardDescription>
            </CardHeader>
            <CardContent>
              {company.bookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Ingen bookinger enda</p>
              ) : (
                <div className="space-y-3">
                  {company.bookings.map(booking => (
                    <Link
                      key={booking.id}
                      href={`/admin/bestillinger/${booking.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.scheduledDate)} • {booking.totalDuration} min
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">
                            {booking.totalPrice.toLocaleString('nb-NO')} kr
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

