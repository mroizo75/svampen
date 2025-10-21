'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, XCircle } from 'lucide-react'

interface CancelBookingButtonProps {
  bookingId: string
  currentStatus: string
  scheduledDate: string
  onSuccess?: () => void
  fullWidth?: boolean
}

export default function CancelBookingButton({ 
  bookingId, 
  currentStatus,
  scheduledDate,
  onSuccess,
  fullWidth = false
}: CancelBookingButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Sjekk om bookingen kan avbestilles
  // Ikke vis knappen hvis status er CANCELLED, COMPLETED eller NO_SHOW
  const cannotCancel = ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(currentStatus)

  if (cannotCancel) {
    return null
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleCancel = async () => {
    console.log('Cancelling booking:', bookingId)
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Kunne ikke avbestille')
      }

      setIsOpen(false)
      
      // Kall onSuccess callback hvis den er definert (for å oppdatere tabellvisning)
      if (onSuccess) {
        onSuccess()
      } else {
        // Fallback til router.refresh for detaljvisning
        router.refresh()
      }
      
      alert('✅ Bestilling avbestilt')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setError(error instanceof Error ? error.message : 'Kunne ikke avbestille bestilling')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size={fullWidth ? "default" : "sm"}
        className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${fullWidth ? 'w-full' : ''}`}
        onClick={handleOpen}
        type="button"
      >
        <XCircle className={`mr-2 ${fullWidth ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
        Avbestill {fullWidth ? 'bestilling' : ''}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avbestill bestilling</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil avbestille denne bestillingen?
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Viktig:</strong> Hvis du avbestiller mindre enn 24 timer før avtalt tid,
              kan det påløpe et avbestillingsgebyr.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Avbestiller...' : 'Ja, avbestill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
