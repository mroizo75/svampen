'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DollarSign, FileText, Loader2, Mail, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface InvoiceActionsProps {
  invoiceId: string
  status: string
  tripletexUrl?: string | null
}

export default function InvoiceActions({ 
  invoiceId, 
  status,
  tripletexUrl
}: InvoiceActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)

  const markAsPaid = async () => {
    try {
      setIsLoading(true)
      setActionType('paid')

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
        }),
      })

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere faktura')
      }

      router.refresh()
      alert('✅ Faktura markert som betalt')
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      alert('❌ Feil ved oppdatering av faktura')
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const resendInvoice = async () => {
    try {
      setIsLoading(true)
      setActionType('resend')

      const response = await fetch(`/api/invoices/${invoiceId}/resend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Kunne ikke sende faktura')
      }

      router.refresh()
      alert('✅ Faktura sendt på nytt til kunden!')
    } catch (error) {
      console.error('Error resending invoice:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil'
      alert(`❌ Feil ved sending av faktura: ${errorMessage}`)
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  if (status === 'PAID') {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled>
            <DollarSign className="mr-2 h-4 w-4" />
            Betalt
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resendInvoice}
            disabled={isLoading}
          >
            {isLoading && actionType === 'resend' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Mail className="mr-2 h-4 w-4" />
            Send kvittering på nytt
          </Button>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Link
            href={`/api/invoices/${invoiceId}/download`}
            target="_blank"
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Last ned PDF
          </Link>
          {tripletexUrl && (
            <Link
              href={tripletexUrl}
              target="_blank"
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FileText className="mr-2 h-4 w-4" />
              Se i Tripletex
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={markAsPaid}
          disabled={isLoading}
        >
          {isLoading && actionType === 'paid' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <DollarSign className="mr-2 h-4 w-4" />
          Marker som betalt
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={resendInvoice}
          disabled={isLoading}
        >
          {isLoading && actionType === 'resend' && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Mail className="mr-2 h-4 w-4" />
          Send på nytt
        </Button>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        <Link
          href={`/api/invoices/${invoiceId}/download`}
          target="_blank"
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Download className="mr-2 h-4 w-4" />
          Last ned PDF
        </Link>
        {tripletexUrl && (
          <Link
            href={tripletexUrl}
            target="_blank"
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            Se i Tripletex
          </Link>
        )}
      </div>
    </div>
  )
}

