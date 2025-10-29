'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddTrainingProviderDialog } from './add-training-provider-dialog'

interface TrainingProvidersTableProps {
  refreshKey: number
}

export function TrainingProvidersTable({ refreshKey }: TrainingProvidersTableProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [localRefreshKey, setLocalRefreshKey] = useState(0)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/training-providers')
        const data = await response.json()
        setProviders(data)
      } catch (error) {
        console.error('Feil ved henting av leverandører:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [refreshKey, localRefreshKey])

  const handleRefresh = () => {
    setLocalRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return <div className="text-center py-8">Laster...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Legg til leverandør
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Ingen leverandører registrert ennå
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Org.nr</TableHead>
                <TableHead>Kontaktperson</TableHead>
                <TableHead>Kontaktinfo</TableHead>
                <TableHead>Kurs holdt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.orgNumber || '-'}</TableCell>
                  <TableCell>{provider.contactPerson || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {provider.contactEmail && <div>{provider.contactEmail}</div>}
                      {provider.contactPhone && <div>{provider.contactPhone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{provider.trainingSessions?.length || 0}</TableCell>
                  <TableCell>
                    {provider.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Inaktiv
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddTrainingProviderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  )
}

