'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, AlertCircle } from 'lucide-react'
import { formatCustomerEmail, isRealCustomerEmail } from '@/lib/customer-email'

interface ChangeCustomerEmailDialogProps {
  customerId: string
  customerName: string
  currentEmail: string
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChangeCustomerEmailDialog({
  customerId,
  customerName,
  currentEmail,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ChangeCustomerEmailDialogProps) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const [email, setEmail] = useState(isRealCustomerEmail(currentEmail) ? currentEmail : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen)
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
    if (nextOpen) {
      setEmail(isRealCustomerEmail(currentEmail) ? currentEmail : '')
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextEmail = email.trim()
    if (!isRealCustomerEmail(nextEmail)) {
      setError('Oppgi en gyldig e-postadresse')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nextEmail }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Kunne ikke endre e-post')
        return
      }

      handleOpenChange(false)
      router.refresh()
    } catch {
      setError('En feil oppstod ved lagring')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button type="button" variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Endre e-post
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Endre e-post</DialogTitle>
            <DialogDescription>
              Oppdater e-postadressen til {customerName} når kunden har fått ny e-post.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <p className="text-sm text-gray-600">Nåværende e-post</p>
              <p className="text-sm font-medium">{formatCustomerEmail(currentEmail)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`new-customer-email-${customerId}`}>Ny e-post *</Label>
              <Input
                id={`new-customer-email-${customerId}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ny@epost.no"
                autoComplete="off"
                required
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lagre e-post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
