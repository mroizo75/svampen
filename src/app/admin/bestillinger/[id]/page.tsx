import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, Building2 } from 'lucide-react'
import Link from 'next/link'
import CompleteBookingButton from '@/components/admin/complete-booking-button'
import InvoiceActions from '@/components/admin/invoice-actions'

async function getBooking(id: string) {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      company: true,  // Inkluder bedriftsinformasjon
      bookingVehicles: {
        include: {
          vehicleType: true,
          bookingServices: {
            include: { service: true },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function BookingDetailsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { id } = await params
  const { success } = await searchParams
  const booking = await getBooking(id)
  if (!booking) notFound()

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success === 'true' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>✅ Bestilling opprettet!</strong> Bookingen er nå registrert i systemet.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/admin/bestillinger"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bestilling #{booking.id.substring(0, 8)}</h1>
            <p className="text-gray-600">
              {booking.user.firstName} {booking.user.lastName} - {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/bestillinger/ny">Ny bestilling</Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Kunde & Booking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {booking.company && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Bedriftskunde
                  </p>
                  <p className="font-medium text-blue-900 mt-1">{booking.company.name}</p>
                  {booking.company.orgNumber && (
                    <p className="text-sm text-blue-700">Org.nr: {booking.company.orgNumber}</p>
                  )}
                  {booking.company.discountPercent && Number(booking.company.discountPercent) > 0 && (
                    <p className="text-sm text-green-700 font-medium mt-1">
                      Rabatt: {Number(booking.company.discountPercent)}%
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Kunde</p>
                <p className="font-medium">{booking.user.firstName} {booking.user.lastName}</p>
                <p className="text-sm">{booking.user.email}</p>
                {booking.user.phone && <p className="text-sm">{booking.user.phone}</p>}
                {(booking.user.address || booking.user.postalCode || booking.user.city) && (
                  <div className="mt-2 text-sm">
                    {booking.user.address && <p>{booking.user.address}</p>}
                    {(booking.user.postalCode || booking.user.city) && (
                      <p>{booking.user.postalCode} {booking.user.city}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Dato & Tid</p>
                <p className="font-medium">
                  {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')} kl. {new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm">Varighet: {Math.floor(booking.totalDuration / 60)}t {booking.totalDuration % 60}min</p>
              </div>
              {booking.customerNotes && (
                <div>
                  <p className="text-sm text-gray-600">Merknader</p>
                  <p className="bg-gray-50 p-2 rounded">{booking.customerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Kjøretøy & Tjenester</CardTitle></CardHeader>
            <CardContent>
              {booking.bookingVehicles.map((v, i) => (
                <div key={v.id} className="mb-4 pb-4 border-b last:border-0">
                  <h3 className="font-semibold">Kjøretøy {i+1}: {v.vehicleType.name}</h3>
                  {v.vehicleInfo && <p className="text-sm text-gray-600">{v.vehicleInfo}</p>}
                  {v.bookingServices.map(s => (
                    <div key={s.id} className="flex justify-between mt-2">
                      <span>{s.service.name}</span>
                      <span className="font-medium">kr {Number(s.totalPrice).toLocaleString('nb-NO')}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-between text-xl font-bold pt-4 border-t">
                <span>TOTAL</span>
                <span className="text-blue-600">kr {Number(booking.totalPrice).toLocaleString('nb-NO')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Info: Faktura opprettes automatisk ved fullføring */}
          {booking.invoices.length === 0 && booking.status !== 'COMPLETED' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Faktura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {booking.company 
                    ? `Faktura for ${booking.company.name} opprettes automatisk når du markerer bookingen som fullført.` 
                    : `Faktura for ${booking.user.firstName} ${booking.user.lastName} opprettes automatisk når du markerer bookingen som fullført.`
                  }
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Opprett faktura → Marker som fullført</span>
                </div>
              </CardContent>
            </Card>
          )}

          {booking.invoices.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💰 Fakturaer ({booking.invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.invoices.map(inv => {
                  const isOverdue = inv.status === 'OVERDUE'
                  const isPaid = inv.status === 'PAID'
                  const isSent = inv.status === 'SENT'
                  
                  return (
                    <div key={inv.id} className={`border-2 rounded-lg p-4 bg-white ${
                      isPaid ? 'border-green-300' : 
                      isOverdue ? 'border-red-300' : 
                      'border-gray-300'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{inv.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">
                            Utstedt: {new Date(inv.issuedDate).toLocaleDateString('nb-NO')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Forfaller: {new Date(inv.dueDate).toLocaleDateString('nb-NO')}
                          </p>
                          {inv.paidDate && (
                            <p className="text-sm text-green-700 font-medium">
                              ✅ Betalt: {new Date(inv.paidDate).toLocaleDateString('nb-NO')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-700">
                            kr {Number(inv.totalAmount).toLocaleString('nb-NO')}
                          </p>
                          <Badge className={
                            isPaid ? 'bg-green-500' : 
                            isOverdue ? 'bg-red-500' : 
                            isSent ? 'bg-blue-500' : 
                            'bg-gray-500'
                          }>
                            {inv.status === 'SENT' ? 'Sendt' :
                             inv.status === 'PAID' ? 'Betalt' :
                             inv.status === 'OVERDUE' ? 'Forfalt' :
                             inv.status === 'DRAFT' ? 'Utkast' :
                             inv.status === 'VIEWED' ? 'Sett' :
                             inv.status === 'CANCELLED' ? 'Kansellert' :
                             inv.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {inv.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-700">Merknad:</p>
                          <p className="text-gray-600">{inv.notes}</p>
                        </div>
                      )}
                      
                      <InvoiceActions 
                        invoiceId={inv.id} 
                        status={inv.status} 
                        tripletexUrl={inv.tripletexUrl}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Status</p>
                <Badge>{booking.status}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Betaling</p>
                <Badge>{booking.paymentStatus}</Badge>
              </div>
              {booking.status !== 'COMPLETED' && (
                <CompleteBookingButton bookingId={booking.id} currentStatus={booking.status} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

