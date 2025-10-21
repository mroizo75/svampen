'use client'

import { useState } from 'react'
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CompleteBookingButtonProps {
  bookingId: string
  currentStatus: string
}

export default function CompleteBookingButton({ bookingId, currentStatus }: CompleteBookingButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('invoice')
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')

  const handleComplete = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          paymentStatus,
          sendInvoice: paymentStatus !== 'PAID',
        }),
      })

      if (!response.ok) {
        throw new Error('Kunne ikke fullføre booking')
      }

      const result = await response.json()
      
      setIsOpen(false)
      router.refresh()

      // Vis suksess melding
      alert(`✅ ${result.message}`)
    } catch (error) {
      console.error('Error completing booking:', error)
      alert('❌ Feil ved fullføring av booking')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={currentStatus === 'COMPLETED'}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Marker som fullført
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fullfør booking</DialogTitle>
          <DialogDescription>
            Når du markerer bookingen som fullført, kan du opprette faktura eller registrere betaling.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Betalingsmetode</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Faktura</SelectItem>
                <SelectItem value="cash">Kontant</SelectItem>
                <SelectItem value="card">Kort</SelectItem>
                <SelectItem value="vipps">Vipps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Betalingsstatus</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNPAID">Ikke betalt (send faktura)</SelectItem>
                <SelectItem value="PAID">Betalt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentStatus === 'UNPAID' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                📧 En faktura vil bli opprettet og sendt til kunden via e-post.
              </p>
            </div>
          )}

          {paymentStatus === 'PAID' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                ✅ Bookingen vil markeres som betalt. Ingen faktura sendes.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fullfør booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

