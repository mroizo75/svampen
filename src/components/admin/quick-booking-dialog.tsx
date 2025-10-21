'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, User, Phone, Mail } from 'lucide-react'

interface QuickBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedTime?: Date | null
}

export default function QuickBookingDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
}: QuickBookingDialogProps) {
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const handleStartBooking = () => {
    // Lagre kunde-info i sessionStorage
    sessionStorage.setItem('quickBookingCustomer', JSON.stringify(customerInfo))
    
    // Lagre valgt dato og tid
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0]
      sessionStorage.setItem('quickBookingDate', dateStr)
    }
    
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString('nb-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      sessionStorage.setItem('quickBookingTime', timeStr)
    }
    
    // Naviger til ny booking siden
    router.push('/admin/bestillinger/ny')
  }

  const canProceed = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ikke valgt'
    return date.toLocaleDateString('nb-NO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (time: Date | null) => {
    if (!time) return 'Ikke valgt'
    return time.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">📞 Rask Booking</DialogTitle>
          <DialogDescription>
            Registrer kunde som ringer inn og start booking-prosessen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Valgt dato og tid */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Dato:</span>
              <span className="text-blue-700">{formatDate(selectedDate)}</span>
            </div>
            {selectedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Tid:</span>
                <span className="text-blue-700">{formatTime(selectedTime)}</span>
              </div>
            )}
          </div>

          {/* Kunde informasjon */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Kundeinformasjon</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="inline h-3 w-3 mr-1" />
                  Fornavn *
                </Label>
                <Input
                  id="firstName"
                  placeholder="Ola"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Etternavn *</Label>
                <Input
                  id="lastName"
                  placeholder="Nordmann"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-3 w-3 mr-1" />
                E-post *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ola.nordmann@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-3 w-3 mr-1" />
                Telefon *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="12345678"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleStartBooking}
              disabled={!canProceed}
            >
              Start Booking →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

