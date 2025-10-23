import { requireAdmin } from '@/lib/auth-utils'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { checkLicense } from '@/lib/license'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sjekk at brukeren er admin
  await requireAdmin()

  // Sjekk lisens - vis warning banner hvis ugyldig
  let licenseStatus
  try {
    licenseStatus = await checkLicense()
  } catch (error) {
    console.error('License check error in admin layout:', error)
    licenseStatus = null
  }

  const showLicenseWarning = licenseStatus && (!licenseStatus.isValid || !licenseStatus.isActive)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {/* License Warning Banner */}
          {showLicenseWarning && licenseStatus && (
            <Alert className="bg-red-50 border-red-200 mb-6">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="block">⚠️ Ingen gyldig lisens</strong>
                    <p className="text-sm mt-1">{licenseStatus.errorMessage || 'Systemet er ikke fullt aktivert.'}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/admin/lisens">
                      Aktiver Lisens
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Main Content */}
          {children}
        </main>
      </div>
    </div>
  )
}