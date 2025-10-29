'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EquipmentTableProps {
  refreshKey: number
  onRefresh: () => void
}

export function EquipmentTable({ refreshKey, onRefresh }: EquipmentTableProps) {
  const router = useRouter()
  const [equipment, setEquipment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/equipment')
        const data = await response.json()
        setEquipment(data)
      } catch (error) {
        console.error('Feil ved henting av utstyr:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [refreshKey])

  if (loading) {
    return <div className="text-center py-8">Laster...</div>
  }

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Ingen utstyr registrert ennå
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Navn</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Plassering</TableHead>
            <TableHead>Sertifiserte</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((eq) => {
            const hasWarnings = eq.stats.expiredCertifications > 0 || eq.stats.expiringCertifications > 0
            
            return (
              <TableRow key={eq.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{eq.name}</div>
                    {eq.manufacturer && (
                      <div className="text-sm text-gray-500">
                        {eq.manufacturer} {eq.model}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{eq.category}</Badge>
                </TableCell>
                <TableCell>{eq.location || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{eq.stats.certifiedUsers}</span>
                    {eq.stats.expiredCertifications > 0 && (
                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                    )}
                    {eq.stats.expiringCertifications > 0 && (
                      <AlertCircle className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {eq.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aktiv
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Inaktiv
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/utstyr/${eq.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

