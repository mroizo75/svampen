/**
 * Admin page for testing SMS functionality
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SMSTestForm from '@/components/admin/sms-test-form'

export default async function SMSTestPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SMS Test</h1>
        <p className="text-gray-600 mt-2">
          Test SMS-funksjonalitet for å verifisere at proSMS-integrasjonen fungerer.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Viktig informasjon</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Test-SMS sendes til ekte telefonnummer og vil koste kreditt</li>
          <li>Bruk ditt eget telefonnummer for testing</li>
          <li>Telefonnummer må ha landskode (+47 for Norge)</li>
          <li>Sjekk at PRO_SMS_API_KEY er konfigurert i .env</li>
        </ul>
      </div>

      <SMSTestForm />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Hvordan teste påminnelser</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">1. Test umiddelbar bekreftelse</h3>
            <p className="text-gray-600 mb-2">
              Gjennomfør en test-booking med ditt telefonnummer. Du vil motta en SMS-bekreftelse umiddelbart.
            </p>
            <a 
              href="/admin/bestillinger/ny" 
              className="text-blue-600 hover:underline"
            >
              → Opprett test-booking
            </a>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">2. Test automatiske påminnelser</h3>
            <p className="text-gray-600 mb-2">
              For å teste automatiske påminnelser, kjør følgende kommando:
            </p>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`curl -X GET \\
  -H "Authorization: Bearer <CRON_SECRET>" \\
  http://localhost:3000/api/sms/reminders`}
            </pre>
            <p className="text-gray-600 mt-2">
              Dette vil sende SMS til alle med booking i morgen.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">3. Opprett test-booking for i morgen</h3>
            <p className="text-gray-600">
              For å teste påminnelsessystemet, opprett en booking med dato i morgen og ditt telefonnummer,
              deretter kjør påminnelse-endepunktet manuelt.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nyttige lenker</h2>
        <ul className="space-y-2">
          <li>
            <a 
              href="https://docs.prosms.se/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📚 proSMS Dokumentasjon
            </a>
          </li>
          <li>
            <a 
              href="/SMS_SETUP.md" 
              className="text-blue-600 hover:underline"
            >
              📖 SMS Setup Guide
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

