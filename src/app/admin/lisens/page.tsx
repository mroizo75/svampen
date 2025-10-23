import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Key,
  Activity
} from 'lucide-react'
import { getLicenseStatus } from '@/lib/license'
import { prisma } from '@/lib/prisma'
import LicenseActivationForm from '@/components/admin/license-activation-form'
import LicenseStatusCard from '@/components/admin/license-status-card'

async function getLicenseData() {
  try {
    const [status, license, validationLogs] = await Promise.all([
      getLicenseStatus(),
      prisma.license.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.licenseValidationLog.findMany({
        take: 10,
        orderBy: { validatedAt: 'desc' },
        include: {
          license: {
            select: {
              licenseKey: true,
              customerName: true,
            },
          },
        },
      }),
    ])

    return {
      status,
      license,
      validationLogs,
    }
  } catch (error) {
    console.error('Error fetching license data:', error)
    return {
      status: await getLicenseStatus(),
      license: null,
      validationLogs: [],
    }
  }
}

export default async function LicensePage() {
  const { status, license, validationLogs } = await getLicenseData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Lisensstyring
        </h1>
        <p className="text-gray-600 mt-1">
          Administrer systemets lisens og aktive funksjoner
        </p>
      </div>

      {/* License Status Alert */}
      {!status.isValid || !status.isActive ? (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>⚠️ Ingen gyldig lisens!</strong> Systemet er ikke aktivert. 
            {status.errorMessage && ` ${status.errorMessage}`}
          </AlertDescription>
        </Alert>
      ) : status.daysUntilExpiry !== null && status.daysUntilExpiry <= 30 ? (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>⚠️ Lisensen utløper snart!</strong> Det er {status.daysUntilExpiry} dager igjen til lisensen utløper.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ Lisens aktiv!</strong> Systemet er fullt operativt.
            {status.daysUntilExpiry !== null && ` Gyldig i ${status.daysUntilExpiry} dager.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current License Status */}
        <LicenseStatusCard status={status} license={license} />

        {/* Activate New License */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Aktiver Ny Lisens
            </CardTitle>
            <CardDescription>
              Skriv inn lisenskode fra www.kksas.no
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LicenseActivationForm />
          </CardContent>
        </Card>
      </div>

      {/* Active Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Aktive Funksjoner
          </CardTitle>
          <CardDescription>
            Funksjoner som er aktivert i din lisens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(status.features).map(([feature, isEnabled]) => (
              <div
                key={feature}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isEnabled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="font-medium text-sm capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {isEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Validerings-historikk
          </CardTitle>
          <CardDescription>
            Siste valideringer mot lisenserver
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Ingen valideringer ennå
            </p>
          ) : (
            <div className="space-y-2">
              {validationLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white"
                >
                  <div className="flex items-center gap-3">
                    {log.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {log.license.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.license.licenseKey.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {new Date(log.validatedAt).toLocaleDateString('nb-NO')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.validatedAt).toLocaleTimeString('nb-NO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Hjelp & Support</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="mb-2">
            <strong>Hvor får jeg lisenskode?</strong>
          </p>
          <p className="mb-4">
            Logg inn på <a href="https://www.kksas.no" className="underline" target="_blank" rel="noopener noreferrer">www.kksas.no</a> for å administrere din lisens.
          </p>
          <p className="mb-2">
            <strong>Kontakt support:</strong>
          </p>
          <p>
            E-post: <a href="mailto:support@kksas.no" className="underline">support@kksas.no</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

