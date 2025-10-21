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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, XCircle } from 'lucide-react'

interface CancelBookingButtonProps {
  bookingId: string
  currentStatus: string
  scheduledDate: string
}

export default function CancelBookingButton({ 
  bookingId, 
  currentStatus,
  scheduledDate 
}: CancelBookingButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Sjekk om bookingen kan avbestilles
  const canCancel = () => {
    // Ikke tillat avbestilling av allerede avbestilte/fullførte bookinger
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(currentStatus)) {
      return false
    }

    // Ikke tillat avbestilling av bookinger i fortiden
    const bookingDate = new Date(scheduledDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset tid for å sammenligne bare dato
    
    if (bookingDate < now) {
      return false
    }

    return true
  }

  const handleCancel = async () => {
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
      router.refresh()
      
      // Vis suksess melding
      alert('✅ Bestilling avbestilt')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setError(error instanceof Error ? error.message : 'Kunne ikke avbestille bestilling')
    } finally {
      setIsLoading(false)
    }
  }

  if (!canCancel()) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <XCircle className="mr-2 h-4 w-4" />
          Avbestill bestilling
        </Button>
      </DialogTrigger>
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
  )
}

