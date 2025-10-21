'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

interface BookingVehicle {
  vehicleType: {
    name: string
  }
  bookingServices: Array<{
    service: {
      name: string
    }
  }>
}

interface Booking {
  id: string
  status: string
  scheduledDate: Date
  scheduledTime: Date
  totalPrice: number
  totalDuration: number
  user: {
    firstName: string
    lastName: string
    email: string
  }
  bookingVehicles: BookingVehicle[]
}

interface BookingsTableProps {
  bookings: Booking[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Venter</Badge>
    case 'CONFIRMED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Bekreftet</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-green-100 text-green-800">Pågår</Badge>
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Fullført</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive">Avbestilt</Badge>
    case 'NO_SHOW':
      return <Badge variant="destructive">Møtte ikke</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRowClick = (bookingId: string, e: React.MouseEvent) => {
    // Ikke naviger hvis man klikket på dropdown-menyen eller dens innhold
    const target = e.target as HTMLElement
    if (target.closest('[role="menu"]') || target.closest('button')) {
      return
    }
    router.push(`/admin/bestillinger/${bookingId}`)
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('Kunne ikke oppdatere status')
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return
    
    try {
      setIsLoading(true)
      await handleStatusChange(selectedBookingId, 'CANCELLED')
      setCancelDialogOpen(false)
      setSelectedBookingId(null)
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunde</TableHead>
            <TableHead>Tjeneste</TableHead>
            <TableHead>Kjøretøy</TableHead>
            <TableHead>Dato & Tid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pris</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const vehicleCount = booking.bookingVehicles.length
            const serviceCount = booking.bookingVehicles.reduce((sum, v) => sum + v.bookingServices.length, 0)
            const vehicleNames = booking.bookingVehicles.map(v => v.vehicleType.name).join(', ')
            
            return (
              <TableRow 
                key={booking.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={(e) => handleRowClick(booking.id, e)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {booking.user.firstName} {booking.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {serviceCount} {serviceCount === 1 ? 'tjeneste' : 'tjenester'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.totalDuration} min totalt
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {vehicleCount} {vehicleCount === 1 ? 'kjøretøy' : 'kjøretøy'}
                  </div>
                  <div className="text-sm text-gray-500">{vehicleNames}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {new Date(booking.scheduledDate).toLocaleDateString('nb-NO')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.scheduledTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(booking.status)}
                </TableCell>
                <TableCell className="font-medium">
                  kr {booking.totalPrice.toLocaleString('nb-NO')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/bestillinger/${booking.id}`)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(booking.id, 'CONFIRMED')
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bekreft
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(booking.id, 'IN_PROGRESS')
                        }}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Marker som pågår
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(booking.id, 'COMPLETED')
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marker som fullført
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBookingId(booking.id)
                          setCancelDialogOpen(true)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Avbestill
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avbestill bestilling</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil avbestille denne bestillingen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isLoading}
            >
              {isLoading ? 'Avbestiller...' : 'Ja, avbestill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

