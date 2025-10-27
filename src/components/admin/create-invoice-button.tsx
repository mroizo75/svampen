'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CreateInvoiceButtonProps {
  bookingId: string
  companyName: string
  totalAmount: number
  hasExistingInvoice?: boolean
}

export function CreateInvoiceButton({
  bookingId,
  companyName,
  totalAmount,
  hasExistingInvoice = false,
}: CreateInvoiceButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCreateInvoice = async () => {
    if (!confirm(`Opprett faktura for ${companyName} på ${totalAmount.toLocaleString('nb-NO')} kr?`)) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          sendToCustomer: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Faktura ${data.invoice.invoiceNumber} opprettet i Tripletex!`)
        setTimeout(() => {
          router.refresh()
        }, 1500)
      } else {
        setError(data.message || 'Kunne ikke opprette faktura')
      }
    } catch (err) {
      setError('En feil oppstod ved opprettelse av faktura')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (hasExistingInvoice) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Faktura er allerede opprettet for denne bookingen
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleCreateInvoice}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Oppretter faktura...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Opprett faktura i Tripletex
          </>
        )}
      </Button>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

