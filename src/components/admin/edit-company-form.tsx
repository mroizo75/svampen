'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Save, X, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  orgNumber: string | null
  contactPersonId: string | null
  contactEmail: string
  contactPhone: string | null
  address: string | null
  postalCode: string | null
  city: string | null
  contractStartDate: Date | null
  contractEndDate: Date | null
  discountPercent: number
  specialTerms: string | null
  paymentTerms: string | null
  invoiceEmail: string | null
  isActive: boolean
  notes: string | null
  contactPerson: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface EditCompanyFormProps {
  company: Company
  users: User[]
}

export function EditCompanyForm({ company, users }: EditCompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: company.name,
    orgNumber: company.orgNumber || '',
    contactPersonId: company.contactPersonId || '',
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone || '',
    address: company.address || '',
    postalCode: company.postalCode || '',
    city: company.city || '',
    contractStartDate: company.contractStartDate 
      ? new Date(company.contractStartDate).toISOString().split('T')[0] 
      : '',
    contractEndDate: company.contractEndDate 
      ? new Date(company.contractEndDate).toISOString().split('T')[0] 
      : '',
    discountPercent: company.discountPercent,
    specialTerms: company.specialTerms || '',
    paymentTerms: company.paymentTerms || '',
    invoiceEmail: company.invoiceEmail || '',
    isActive: company.isActive,
    notes: company.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          contactPersonId: formData.contactPersonId || null,
          contractStartDate: formData.contractStartDate || null,
          contractEndDate: formData.contractEndDate || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Kunne ikke oppdatere bedrift')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/bedriftskunder/${company.id}`)
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/bedriftskunder/${company.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/bedriftskunder/${company.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rediger bedrift</h1>
          <p className="text-gray-600">{company.name}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            ✅ Bedrift oppdatert! Sender deg tilbake...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grunnleggende informasjon */}
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende informasjon</CardTitle>
            <CardDescription>Bedriftens grunnleggende detaljer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bedriftsnavn *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                <Input
                  id="orgNumber"
                  placeholder="999999999"
                  value={formData.orgNumber}
                  onChange={(e) => setFormData({ ...formData, orgNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktiv bedrift
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Kontaktinformasjon */}
        <Card>
          <CardHeader>
            <CardTitle>Kontaktinformasjon</CardTitle>
            <CardDescription>E-post og telefon for bedriften</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Kontakt e-post *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonId">Kontaktperson (valgfritt)</Label>
              <Select
                value={formData.contactPersonId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, contactPersonId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kontaktperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen kontaktperson</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
            <CardDescription>Bedriftens besøksadresse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Gateadresse</Label>
              <Input
                id="address"
                placeholder="Eksempelveien 1"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  placeholder="0123"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Poststed</Label>
                <Input
                  id="city"
                  placeholder="Oslo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avtaledetaljer */}
        <Card>
          <CardHeader>
            <CardTitle>Avtaledetaljer</CardTitle>
            <CardDescription>Kontrakt og faktureringsvilkår</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractStartDate">Avtalens startdato</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">Avtalens sluttdato</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercent">Rabatt (%)</Label>
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceEmail">Faktura e-post (valgfritt)</Label>
              <Input
                id="invoiceEmail"
                type="email"
                placeholder="faktura@bedrift.no"
                value={formData.invoiceEmail}
                onChange={(e) => setFormData({ ...formData, invoiceEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Betalingsvilkår</Label>
              <Input
                id="paymentTerms"
                placeholder="30 dager netto"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialTerms">Spesielle vilkår</Label>
              <Textarea
                id="specialTerms"
                placeholder="Spesielle avtaler eller merknader..."
                value={formData.specialTerms}
                onChange={(e) => setFormData({ ...formData, specialTerms: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interne notater */}
        <Card>
          <CardHeader>
            <CardTitle>Interne notater</CardTitle>
            <CardDescription>Kun synlig for administratorer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                placeholder="Interne notater om bedriften..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Handlinger */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Lagrer...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lagre endringer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

