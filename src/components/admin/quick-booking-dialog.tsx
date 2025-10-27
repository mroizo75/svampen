'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, User, Phone, Mail, Building2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface QuickBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedTime?: Date | null
}

export default function QuickBookingDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
}: QuickBookingDialogProps) {
  const router = useRouter()
  const [customerType, setCustomerType] = useState<'private' | 'company'>('private')
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Hent bedrifter
  useEffect(() => {
    if (open) {
      fetch('/api/admin/companies?activeOnly=true')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCompanies(data)
          }
        })
        .catch(err => console.error('Error fetching companies:', err))
    }
  }, [open])

  // Auto-fyll kundeinformasjon ved bedriftsvalg
  useEffect(() => {
    if (selectedCompany) {
      setCustomerInfo({
        firstName: selectedCompany.contactPerson?.firstName || '',
        lastName: selectedCompany.contactPerson?.lastName || '',
        email: selectedCompany.contactEmail,
        phone: selectedCompany.contactPhone || '',
      })
      
      // Hent booking-maler for bedriften
      fetch(`/api/admin/booking-templates?companyId=${selectedCompany.id}&activeOnly=true`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTemplates(data)
          }
        })
        .catch(err => console.error('Error fetching templates:', err))
    } else {
      setTemplates([])
      setSelectedTemplate(null)
    }
  }, [selectedCompany])

  const handleStartBooking = () => {
    // Lagre kundetype
    sessionStorage.setItem('quickBookingCustomerType', customerType)
    
    // Lagre kunde-info i sessionStorage
    sessionStorage.setItem('quickBookingCustomer', JSON.stringify(customerInfo))
    
    // Lagre bedrifts-ID hvis bedriftskunde
    if (customerType === 'company' && selectedCompany) {
      sessionStorage.setItem('quickBookingCompanyId', selectedCompany.id)
    } else {
      sessionStorage.removeItem('quickBookingCompanyId')
    }
    
    // Lagre valgt mal hvis valgt
    if (selectedTemplate) {
      sessionStorage.setItem('quickBookingTemplate', JSON.stringify(selectedTemplate))
    } else {
      sessionStorage.removeItem('quickBookingTemplate')
    }
    
    // Lagre valgt dato og tid
    if (selectedDate) {
      // Konverter Date til lokal dato-string uten timezone-konvertering
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      sessionStorage.setItem('quickBookingDate', dateStr)
    }
    
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString('nb-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      sessionStorage.setItem('quickBookingTime', timeStr)
    }
    
    // Naviger til ny booking siden
    router.push('/admin/bestillinger/ny')
  }

  const canProceed = () => {
    if (customerType === 'company') {
      return !!selectedCompany
    }
    return customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ikke valgt'
    return date.toLocaleDateString('nb-NO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (time: Date | null) => {
    if (!time) return 'Ikke valgt'
    return time.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">📞 Rask Booking</DialogTitle>
          <DialogDescription>
            Registrer kunde som ringer inn og start booking-prosessen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Valgt dato og tid */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Dato:</span>
              <span className="text-blue-700">{formatDate(selectedDate)}</span>
            </div>
            {selectedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Tid:</span>
                <span className="text-blue-700">{formatTime(selectedTime)}</span>
              </div>
            )}
          </div>

          {/* Kundetype valg */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Kundetype</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCustomerType('private')
                  setSelectedCompany(null)
                  setCustomerInfo({ firstName: '', lastName: '', email: '', phone: '' })
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  customerType === 'private'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-semibold">Privatkunde</span>
                </div>
                <p className="text-xs text-gray-600">Fyll inn manuelt</p>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('company')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  customerType === 'company'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                  <span className="font-semibold">Bedriftskunde</span>
                </div>
                <p className="text-xs text-gray-600">Velg bedrift</p>
              </button>
            </div>
          </div>

          {/* Bedriftsvalg */}
          {customerType === 'company' && (
            <div className="space-y-4">
              <Label htmlFor="company-select">Velg bedrift *</Label>
              {companies.length === 0 ? (
                <p className="text-sm text-gray-500">Ingen aktive bedrifter funnet</p>
              ) : (
                <>
                  <select
                    id="company-select"
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const company = companies.find(c => c.id === e.target.value)
                      setSelectedCompany(company || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Velg bedrift --</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.discountPercent > 0 && `(${company.discountPercent}% rabatt)`}
                      </option>
                    ))}
                  </select>
                  
                  {selectedCompany && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        <div className="font-medium">{selectedCompany.name}</div>
                        <div className="text-xs mt-1">
                          {selectedCompany.contactEmail}
                          {selectedCompany.discountPercent > 0 && ` • ${selectedCompany.discountPercent}% rabatt`}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}

          {/* Booking-maler (kun for bedriftskunder) */}
          {customerType === 'company' && selectedCompany && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Bruk booking-mal (valgfritt)</Label>
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <p className="font-medium mb-2">
                    {templates.length} mal{templates.length > 1 ? 'er' : ''} tilgjengelig
                  </p>
                  <div className="space-y-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id === selectedTemplate?.id ? null : template)}
                        className={`w-full p-3 text-left border-2 rounded transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-blue-200 hover:border-blue-400 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-blue-900">{template.name}</div>
                            <div className="text-xs text-blue-700">
                              {template.frequency === 'WEEKLY' ? 'Ukentlig' : 'Månedlig'} • {template.time}
                            </div>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedTemplate && (
                    <p className="text-xs text-blue-600 mt-2">
                      ⚡ Kjøretøy og tjenester fylles ut automatisk fra malen!
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Kunde informasjon */}
          {customerType === 'private' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Kundeinformasjon</h3>
              
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="inline h-3 w-3 mr-1" />
                  Fornavn *
                </Label>
                <Input
                  id="firstName"
                  placeholder="Ola"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Etternavn *</Label>
                <Input
                  id="lastName"
                  placeholder="Nordmann"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-3 w-3 mr-1" />
                E-post *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ola.nordmann@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-3 w-3 mr-1" />
                Telefon *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="12345678"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleStartBooking}
              disabled={!canProceed()}
            >
              Start Booking →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

