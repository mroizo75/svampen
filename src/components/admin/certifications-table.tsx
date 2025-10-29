'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface CertificationsTableProps {
  refreshKey: number
  onRefresh: () => void
}

export function CertificationsTable({ refreshKey, onRefresh }: CertificationsTableProps) {
  const [certifications, setCertifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true)
        let url = '/api/admin/certifications?isActive=true'
        
        if (filter === 'expiring') {
          url += '&expiringSoon=30'
        }

        const response = await fetch(url)
        const data = await response.json()
        
        // Filtrer basert på valgt filter
        let filtered = data
        if (filter === 'expired') {
          filtered = data.filter((cert: any) => cert.status === 'expired')
        }

        setCertifications(filtered)
      } catch (error) {
        console.error('Feil ved henting av sertifiseringer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCertifications()
  }, [refreshKey, filter])

  const getStatusBadge = (cert: any) => {
    switch (cert.status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktiv
          </Badge>
        )
      case 'expiring_soon':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Utløper snart ({cert.daysUntilExpiry} dager)
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Utløpt
          </Badge>
        )
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Tilbakekalt
          </Badge>
        )
      default:
        return null
    }
  }

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      BASIC: 'Grunnleggende',
      INTERMEDIATE: 'Selvstendig',
      ADVANCED: 'Avansert',
      TRAINER: 'Opplærer',
      SUPPLIER: 'Leverandør',
    }
    return levels[level] || level
  }

  if (loading) {
    return <div className="text-center py-8">Laster...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle aktive</SelectItem>
            <SelectItem value="expiring">Utløper snart</SelectItem>
            <SelectItem value="expired">Utløpte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Ingen sertifiseringer funnet
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bruker</TableHead>
                <TableHead>Utstyr</TableHead>
                <TableHead>Nivå</TableHead>
                <TableHead>Sertifisert dato</TableHead>
                <TableHead>Utløper</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certifications.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {cert.user.firstName} {cert.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{cert.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{cert.equipment.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getLevelLabel(cert.certificationLevel)}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(cert.certificationDate), 'PPP', { locale: nb })}
                  </TableCell>
                  <TableCell>
                    {cert.expiresAt ? (
                      format(new Date(cert.expiresAt), 'PPP', { locale: nb })
                    ) : (
                      <span className="text-gray-500">Ingen utløp</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(cert)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

