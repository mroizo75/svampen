'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings,
  Clock,
  Phone,
  Bell,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface SettingsFormProps {
  initialSettings: Record<string, { value: string }>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    // Business hours
    business_hours_start: initialSettings.business_hours_start?.value || '08:00',
    business_hours_end: initialSettings.business_hours_end?.value || '16:00',
    booking_advance_days: initialSettings.booking_advance_days?.value || '90',
    
    // Contact info
    business_name: initialSettings.business_name?.value || 'Svampen',
    business_phone: initialSettings.business_phone?.value || '38347470',
    business_email: initialSettings.business_email?.value || 'joachim@amento.no',
    business_address: initialSettings.business_address?.value || '',
    
    // Booking settings
    no_show_fee_percentage: initialSettings.no_show_fee_percentage?.value || '0',
    min_advance_booking_hours: initialSettings.min_advance_booking_hours?.value || '24',
    auto_confirm_bookings: initialSettings.auto_confirm_bookings?.value === 'true',
    
    // Notifications
    notify_admin_new_booking: initialSettings.notify_admin_new_booking?.value !== 'false',
    notify_customer_confirmation: initialSettings.notify_customer_confirmation?.value !== 'false',
    notify_customer_reminder: initialSettings.notify_customer_reminder?.value === 'true',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke lagre innstillinger')
      }

      setSuccess(true)
      router.refresh()
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Innstillingene ble lagret!</AlertDescription>
        </Alert>
      )}

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Åpningstider
          </CardTitle>
          <CardDescription>
            Sett standard åpningstider for booking systemet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Åpningstid</Label>
              <Input 
                id="start-time" 
                type="time" 
                value={formData.business_hours_start}
                onChange={(e) => setFormData({ ...formData, business_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Stengetid</Label>
              <Input 
                id="end-time" 
                type="time" 
                value={formData.business_hours_end}
                onChange={(e) => setFormData({ ...formData, business_hours_end: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance-days">Booking frem i tid (dager)</Label>
            <Input 
              id="advance-days" 
              type="number" 
              min="1" 
              max="365"
              value={formData.booking_advance_days}
              onChange={(e) => setFormData({ ...formData, booking_advance_days: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Hvor mange dager frem i tid kan kunder bestille (minimum 90 dager anbefalt)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="mr-2 h-5 w-5" />
            Kontakt informasjon
          </CardTitle>
          <CardDescription>
            Oppdater bedriftens kontaktinformasjon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Bedriftsnavn</Label>
            <Input 
              id="business-name" 
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea 
              id="address" 
              placeholder="Gateadresse&#10;Postnummer Sted"
              rows={3}
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Booking innstillinger
          </CardTitle>
          <CardDescription>
            Konfigurer booking regler og policyer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="no-show-fee">No-show gebyr (%)</Label>
            <Input 
              id="no-show-fee" 
              type="number" 
              min="0" 
              max="100"
              value={formData.no_show_fee_percentage}
              onChange={(e) => setFormData({ ...formData, no_show_fee_percentage: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Prosent av prisen som faktureres ved no-show (0 = ingen gebyr)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-advance-booking">Minimum forhåndsbestilling (timer)</Label>
            <Input 
              id="min-advance-booking" 
              type="number" 
              min="1" 
              max="168"
              value={formData.min_advance_booking_hours}
              onChange={(e) => setFormData({ ...formData, min_advance_booking_hours: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Hvor mange timer før må kunder bestille (24 timer = 1 dag)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="auto-confirm">Automatisk bekreftelse</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-confirm"
                checked={formData.auto_confirm_bookings}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_confirm_bookings: checked })}
              />
              <span className="text-sm text-gray-600">
                Bekreft nye bestillinger automatisk
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Varslinger
          </CardTitle>
          <CardDescription>
            Konfigurer e-post og SMS varslinger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>E-post til admin ved ny bestilling</Label>
                <p className="text-sm text-gray-500">Send varsel til admin når kunde bestiller</p>
              </div>
              <Switch 
                checked={formData.notify_admin_new_booking}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_admin_new_booking: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Bekreftelse e-post til kunde</Label>
                <p className="text-sm text-gray-500">Send bekreftelse når bestilling er godkjent</p>
              </div>
              <Switch 
                checked={formData.notify_customer_confirmation}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_customer_confirmation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS påminnelse 24 timer før</Label>
                <p className="text-sm text-gray-500">Send SMS påminnelse dagen før avtalen</p>
              </div>
              <Switch 
                checked={formData.notify_customer_reminder}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_customer_reminder: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lagre alle innstillinger
        </Button>
      </div>
    </form>
  )
}

