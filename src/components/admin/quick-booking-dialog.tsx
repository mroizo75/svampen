'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

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

  const handleStartBooking = () => {
    // Lagre kun valgt dato og tid i sessionStorage
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      sessionStorage.setItem('quickBookingDate', dateStr)
    }
    
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString('nb-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      sessionStorage.setItem('quickBookingTime', timeStr)
    }
    
    // Lukk dialog og naviger
    onOpenChange(false)
    router.push('/admin/bestillinger/ny')
  }

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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Opprett ny bestilling</DialogTitle>
          <DialogDescription>
            Du valgte dato og tid i kalenderen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valgt dato og tid - Visuelt fremhevet */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-center gap-3 text-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-gray-900">{formatDate(selectedDate)}</span>
            </div>
            {selectedTime && (
              <div className="flex items-center justify-center gap-3 text-lg mt-2">
                <Clock className="h-6 w-6 text-purple-600" />
                <span className="font-bold text-gray-900">{formatTime(selectedTime)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center text-sm text-gray-600">
            <p>Klikk fortsett for å velge kunde, kjøretøy og tjenester</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleStartBooking}
            >
              Fortsett
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

