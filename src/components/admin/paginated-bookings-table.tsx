'use client'

import { useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginatedBookingsTableProps {
  bookings: any[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Bekreftet</Badge>
    case 'IN_PROGRESS':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Pågår</Badge>
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

export function PaginatedBookingsTable({ bookings }: PaginatedBookingsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Beregn paginering
  const totalPages = Math.ceil(bookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBookings = bookings.slice(startIndex, endIndex)

  // Reset til side 1 når itemsPerPage endres
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Naviger til side
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-4">
      {/* Paginerings-kontroller øverst */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Vis</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">per side</span>
        </div>

        <div className="text-sm text-gray-500">
          Viser {startIndex + 1}-{Math.min(endIndex, bookings.length)} av {bookings.length} bestillinger
        </div>
      </div>

      {/* Tabell */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Tjeneste</TableHead>
              <TableHead>Kjøretøy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Beløp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBookings.map((booking) => {
              const serviceCount = booking.bookingVehicles.reduce(
                (sum: number, v: any) => sum + v.bookingServices.length, 
                0
              )
              const vehicleNames = booking.bookingVehicles
                .map((v: any) => v.vehicleType.name)
                .join(', ')
              
              return (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-3 w-3 text-gray-400" />
                      {new Date(booking.createdAt).toLocaleDateString('nb-NO')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.user.firstName} {booking.user.lastName}
                  </TableCell>
                  <TableCell>
                    {serviceCount} {serviceCount === 1 ? 'tjeneste' : 'tjenester'}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={vehicleNames}>
                      {vehicleNames}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    kr {booking.totalPrice.toLocaleString('nb-NO')}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginerings-kontroller nederst */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Forrige
        </Button>

        <div className="flex items-center space-x-2">
          {/* Første side */}
          {currentPage > 3 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
              >
                1
              </Button>
              {currentPage > 4 && <span className="text-gray-500">...</span>}
            </>
          )}

          {/* Sider rundt current page */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => 
              page === currentPage ||
              page === currentPage - 1 ||
              page === currentPage + 1 ||
              page === currentPage - 2 ||
              page === currentPage + 2
            )
            .map(page => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            ))}

          {/* Siste side */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Neste
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Side info */}
      <div className="text-center text-sm text-gray-500">
        Side {currentPage} av {totalPages}
      </div>
    </div>
  )
}

