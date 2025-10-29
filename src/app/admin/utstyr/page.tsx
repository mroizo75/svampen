'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, AlertTriangle, CheckCircle, Clock, Users, Wrench } from 'lucide-react'
import { AddEquipmentDialog } from '@/components/admin/add-equipment-dialog'
import { AddTrainingDialog } from '@/components/admin/add-training-dialog'
import { EquipmentTable } from '@/components/admin/equipment-table'
import { CertificationsTable } from '@/components/admin/certifications-table'
import { TrainingProvidersTable } from '@/components/admin/training-providers-table'

interface EquipmentStats {
  totalEquipment: number
  certifiedUsers: number
  expiringSoon: number
  expired: number
}

export default function UtstyrPage() {
  const [stats, setStats] = useState<EquipmentStats>({
    totalEquipment: 0,
    certifiedUsers: 0,
    expiringSoon: 0,
    expired: 0,
  })
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false)
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Hent statistikk
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Hent utstyr
        const equipmentRes = await fetch('/api/admin/equipment')
        const equipment = await equipmentRes.json()

        // Hent sertifiseringer
        const certsRes = await fetch('/api/admin/certifications?isActive=true')
        const certifications = await certsRes.json()

        // Beregn statistikk
        const totalEquipment = equipment.length
        const certifiedUsersSet = new Set(
          certifications.map((cert: any) => cert.userId)
        )

        const expiringSoon = certifications.filter((cert: any) => {
          if (!cert.expiresAt) return false
          const daysUntilExpiry = Math.floor(
            (new Date(cert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30
        }).length

        const expired = certifications.filter((cert: any) => {
          if (!cert.expiresAt) return false
          return new Date(cert.expiresAt).getTime() < Date.now()
        }).length

        setStats({
          totalEquipment,
          certifiedUsers: certifiedUsersSet.size,
          expiringSoon,
          expired,
        })
      } catch (error) {
        console.error('Feil ved henting av statistikk:', error)
      }
    }

    fetchStats()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utstyr & Opplæring</h1>
          <p className="text-gray-500 mt-1">
            Håndter utstyr, opplæring og sertifiseringer i henhold til Arbeidsmiljøloven § 4-5
          </p>
        </div>
      </div>

      {/* Statistikk-kort */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt utstyr</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipment}</div>
            <p className="text-xs text-muted-foreground">
              Registrerte utstyr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sertifiserte brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Aktive sertifiseringer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utløper snart</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Innen 30 dager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utløpte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Må fornyes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for ulike visninger */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">Utstyr</TabsTrigger>
          <TabsTrigger value="certifications">Sertifiseringer</TabsTrigger>
          <TabsTrigger value="providers">Leverandører</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Utstyrsoversikt</CardTitle>
                  <CardDescription>
                    Administrer alt utstyr som krever opplæring
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddEquipmentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til utstyr
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EquipmentTable refreshKey={refreshKey} onRefresh={handleRefresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sertifiseringer</CardTitle>
                  <CardDescription>
                    Oversikt over alle brukersertifiseringer
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddTrainingOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrer opplæring
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CertificationsTable refreshKey={refreshKey} onRefresh={handleRefresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opplæringsleverandører</CardTitle>
              <CardDescription>
                Administrer leverandører av utstyrsspesifikk opplæring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingProvidersTable refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddEquipmentDialog
        open={isAddEquipmentOpen}
        onOpenChange={setIsAddEquipmentOpen}
        onSuccess={handleRefresh}
      />

      <AddTrainingDialog
        open={isAddTrainingOpen}
        onOpenChange={setIsAddTrainingOpen}
        onSuccess={handleRefresh}
      />
    </div>
  )
}

