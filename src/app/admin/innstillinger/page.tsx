import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Mail,
  Shield,
  Database,
  Palette
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from '@/components/admin/settings-form'

async function getAdminSettings() {
  try {
    const settings = await prisma.adminSettings.findMany({
      orderBy: {
        key: 'asc',
      },
    })

    return settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
      }
      return acc
    }, {} as Record<string, { value: string }>)
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return {}
  }
}

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Innstillinger</h1>
        <p className="text-gray-600">Administrer system innstillinger og konfigurasjon</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2">
          <SettingsForm initialSettings={settings} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Database backup
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Sikkerhet
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Palette className="mr-2 h-4 w-4" />
                Tema innstillinger
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System informasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Versjon:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database:</span>
                <span className="font-medium">MySQL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sist oppdatert:</span>
                <span className="font-medium">{new Date().toLocaleDateString('nb-NO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Oppetid:</span>
                <span className="font-medium">99.9%</span>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Trenger du hjelp med systemet?
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Kontakt support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}