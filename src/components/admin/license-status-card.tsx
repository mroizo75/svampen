'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Calendar, User, RefreshCw } from 'lucide-react'
import { LicenseStatus } from '@/lib/license'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LicenseStatusCardProps {
  status: LicenseStatus
  license: any
}

export default function LicenseStatusCard({ status, license }: LicenseStatusCardProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/license/refresh', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error refreshing license:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Lisens Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Oppdaterer...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Oppdater
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Nåværende lisens-informasjon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          {status.isValid && status.isActive ? (
            <Badge className="bg-green-600">Aktiv</Badge>
          ) : (
            <Badge variant="destructive">Inaktiv</Badge>
          )}
        </div>

        {/* Customer Name */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <User className="h-4 w-4" />
            Kunde:
          </span>
          <span className="font-medium">{status.customerName}</span>
        </div>

        {/* License Key */}
        {license && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lisenskode:</span>
            <span className="font-mono text-sm">
              {license.licenseKey.substring(0, 20)}...
            </span>
          </div>
        )}

        {/* Expiry Date */}
        {status.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Utløper:
            </span>
            <div className="text-right">
              <p className="font-medium">
                {new Date(status.expiresAt).toLocaleDateString('nb-NO')}
              </p>
              {status.daysUntilExpiry !== null && (
                <p className={`text-xs ${
                  status.daysUntilExpiry <= 30 ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {status.daysUntilExpiry} dager igjen
                </p>
              )}
            </div>
          </div>
        )}

        {/* Last Validated */}
        {license?.lastValidatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sist validert:</span>
            <span className="text-sm text-gray-500">
              {new Date(license.lastValidatedAt).toLocaleString('nb-NO')}
            </span>
          </div>
        )}

        {/* Domain */}
        {license?.customerDomain && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Domene:</span>
            <span className="font-medium">{license.customerDomain}</span>
          </div>
        )}

        {/* Max Bookings */}
        {license?.maxBookingsPerMonth && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Maks bookinger/mnd:</span>
            <span className="font-medium">{license.maxBookingsPerMonth}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

