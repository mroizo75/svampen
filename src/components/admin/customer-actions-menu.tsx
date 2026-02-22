'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Eye, Edit, Calendar, Shield, UserX, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface CustomerActionsMenuProps {
  customerId: string
  customerName: string
  role: string
  hasBookings: boolean
}

export function CustomerActionsMenu({
  customerId,
  customerName,
  role,
  hasBookings,
}: CustomerActionsMenuProps) {
  const router = useRouter()
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeactivate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Kunne ikke deaktivere konto')
      }
      setDeactivateOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/kunder/${customerId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Se detaljer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/kunder/${customerId}?edit=true`}>
              <Edit className="mr-2 h-4 w-4" />
              Rediger kunde
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/bestillinger?kunde=${customerId}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Se bestillinger
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {role === 'USER' && (
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Gjør til admin
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeactivateOpen(true)}
          >
            <UserX className="mr-2 h-4 w-4" />
            Deaktiver konto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deaktiver konto</DialogTitle>
            <DialogDescription>
              {hasBookings
                ? `${customerName} har eksisterende bestillinger. Kontoen deaktiveres ved å anonymisere e-postadressen – bestillingene beholdes. Den originale e-postadressen frigjøres og kan brukes på nytt.`
                : `Er du sikker på at du vil deaktivere kontoen til ${customerName}? Dette frigjør e-postadressen så den kan registreres på nytt.`}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={loading}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deaktiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
