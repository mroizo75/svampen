'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, AlertCircle, CheckCircle, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddCompanyDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    postalCode: '',
    city: '',
    contractStartDate: '',
    contractEndDate: '',
    discountPercent: '',
    specialTerms: '',
    paymentTerms: '',
    invoiceEmail: '',
    notes: '',
    isActive: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
    setSuccess(null)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Noe gikk galt')
      }

      setSuccess('Bedrift opprettet!')
      
      // Reset skjema
      setFormData({
        name: '',
        orgNumber: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        postalCode: '',
        city: '',
        contractStartDate: '',
        contractEndDate: '',
        discountPercent: '',
        specialTerms: '',
        paymentTerms: '',
        invoiceEmail: '',
        notes: '',
        isActive: true,
      })

      // Vent litt så brukeren ser suksessmeldingen
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Feil ved opprettelse av bedrift')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset alt når dialogen lukkes
        setFormData({
          name: '',
          orgNumber: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          postalCode: '',
          city: '',
          contractStartDate: '',
          contractEndDate: '',
          discountPercent: '',
          specialTerms: '',
          paymentTerms: '',
          invoiceEmail: '',
          notes: '',
          isActive: true,
        })
        setError(null)
        setSuccess(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Legg til bedrift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Legg til ny bedriftskunde
            </DialogTitle>
            <DialogDescription>
              Opprett en ny bedriftskunde med fasteavtale og spesialpriser
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Bedriftsinformasjon */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Bedriftsinformasjon</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">
                  Bedriftsnavn <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Eksempel AS"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                  <Input
                    id="orgNumber"
                    name="orgNumber"
                    value={formData.orgNumber}
                    onChange={handleChange}
                    placeholder="123456789"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">By</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Oslo"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Gateadresse 123"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="0123"
                  disabled={loading}
                />
              </div>
            </div>

            <Separator />

            {/* Kontaktinformasjon */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Kontaktinformasjon</h3>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Kontakt e-post <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="kontakt@eksempel.no"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+47 123 45 678"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceEmail">Faktura e-post</Label>
                <Input
                  id="invoiceEmail"
                  name="invoiceEmail"
                  type="email"
                  value={formData.invoiceEmail}
                  onChange={handleChange}
                  placeholder="faktura@eksempel.no (valgfritt)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Hvis tom, brukes kontakt e-post for faktura
                </p>
              </div>
            </div>

            <Separator />

            {/* Avtaledetaljer */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Avtaledetaljer</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">Avtalens startdato</Label>
                  <Input
                    id="contractStartDate"
                    name="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">Avtalens sluttdato</Label>
                  <Input
                    id="contractEndDate"
                    name="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Hvis tom = løpende avtale
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Rabatt (%)</Label>
                  <Input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discountPercent}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Betalingsvilkår</Label>
                  <Input
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    placeholder="30 dager netto"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialTerms">Spesielle avtalevilkår</Label>
                <Textarea
                  id="specialTerms"
                  name="specialTerms"
                  value={formData.specialTerms}
                  onChange={handleChange}
                  placeholder="Spesielle vilkår eller rabatter..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            <Separator />

            {/* Notater og status */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Administrative notater</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Interne notater om bedriften..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Aktiv bedrift</Label>
                  <p className="text-xs text-gray-500">
                    Bedriften kan benytte sine avtalevilkår
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oppretter...' : 'Opprett bedrift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

