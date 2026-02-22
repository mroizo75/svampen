'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle, CheckCircle, Search, X, User, UserPlus } from 'lucide-react'
import { MultiBookingWizard } from '@/components/booking/multi-booking-wizard'

interface CustomerResult {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

interface AdminBookingWizardProps {
  services: any[]
  vehicleTypes: any[]
  businessHoursStart?: string
  businessHoursEnd?: string
}

export default function AdminBookingWizard({
  services,
  vehicleTypes,
  businessHoursStart = '08:00',
  businessHoursEnd = '16:00',
}: AdminBookingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<'customer' | 'booking'>('customer')
  const [error, setError] = useState<string | null>(null)

  // Søketilstand
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null)
  const [mode, setMode] = useState<'search' | 'new'>('search')
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manuell skjemainfo (brukes kun ved ny kunde)
  const [manualInfo, setManualInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })

  // Lukk dropdown ved klikk utenfor
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sjekk for quick booking data fra kalender
  useEffect(() => {
    const quickBookingCustomer = sessionStorage.getItem('quickBookingCustomer')
    if (quickBookingCustomer) {
      try {
        const parsed = JSON.parse(quickBookingCustomer)
        // Sett direkte som valgt kunde
        setSelectedCustomer({ id: '', ...parsed })
        setStep('booking')
        sessionStorage.removeItem('quickBookingCustomer')
      } catch (e) {
        console.error('Error parsing quick booking data:', e)
      }
    }
  }, [])

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users || [])
        setShowDropdown(true)
      }
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSelectedCustomer(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const handleSelectCustomer = (customer: CustomerResult) => {
    setSelectedCustomer(customer)
    setSearchQuery(`${customer.firstName} ${customer.lastName}`)
    setShowDropdown(false)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedCustomer(null)
    setSearchResults([])
    setShowDropdown(false)
  }

  const getCustomerInfo = () => {
    if (selectedCustomer) {
      return {
        email: selectedCustomer.email,
        firstName: selectedCustomer.firstName,
        lastName: selectedCustomer.lastName,
        phone: selectedCustomer.phone || '',
      }
    }
    return manualInfo
  }

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault()
    const info = getCustomerInfo()
    if (!info.email || !info.firstName || !info.lastName) {
      setError('Vennligst fyll ut alle påkrevde felter')
      return
    }
    setError(null)
    setStep('booking')
  }

  const customerInfo = getCustomerInfo()

  if (step === 'booking') {
    return (
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Booking for:</strong> {customerInfo.firstName} {customerInfo.lastName} ({customerInfo.email})
            <Button
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0 text-blue-600"
              onClick={() => setStep('customer')}
            >
              Endre kunde
            </Button>
          </AlertDescription>
        </Alert>

        <MultiBookingWizard
          services={services}
          vehicleTypes={vehicleTypes}
          isAdminBooking={true}
          prefilledCustomerInfo={customerInfo}
          businessHoursStart={businessHoursStart}
          businessHoursEnd={businessHoursEnd}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleProceed} className="space-y-6">
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Kundeinformasjon</h3>
          <p className="text-sm text-gray-500 mt-1">
            Søk etter eksisterende kunde, eller registrer ny.
          </p>
        </div>

        {/* Søk etter eksisterende kunde */}
        <div className="space-y-2" ref={searchRef}>
          <Label>Søk etter eksisterende kunde</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              className="pl-9 pr-9"
              placeholder="Navn, e-post eller telefonnummer..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              autoComplete="off"
            />
            <div className="absolute right-3 top-2.5">
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : searchQuery ? (
                <button type="button" onClick={handleClearSearch}>
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              ) : null}
            </div>

            {/* Dropdown med resultater */}
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Ingen kunder funnet for «{searchQuery}»
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-medium text-sm">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {customer.email}
                              {customer.phone && ` · ${customer.phone}`}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Valgt kunde */}
          {selectedCustomer && (
            <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-green-900">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </span>
                <span className="text-green-700 ml-2">{selectedCustomer.email}</span>
                {selectedCustomer.phone && (
                  <span className="text-green-700 ml-2">{selectedCustomer.phone}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Skillelinje med "Eller ny kunde" */}
        {!selectedCustomer && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                onClick={() => setMode(mode === 'new' ? 'search' : 'new')}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {mode === 'new' ? 'Skjul ny kunde' : 'Registrer ny kunde'}
              </button>
              <Separator className="flex-1" />
            </div>

            {/* Manuelt skjema for ny kunde */}
            {mode === 'new' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Fornavn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={manualInfo.firstName}
                    onChange={(e) => setManualInfo({ ...manualInfo, firstName: e.target.value })}
                    placeholder="Ola"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Etternavn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={manualInfo.lastName}
                    onChange={(e) => setManualInfo({ ...manualInfo, lastName: e.target.value })}
                    placeholder="Nordmann"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-post <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={manualInfo.email}
                    onChange={(e) => setManualInfo({ ...manualInfo, email: e.target.value })}
                    placeholder="ola@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={manualInfo.phone}
                    onChange={(e) => setManualInfo({ ...manualInfo, phone: e.target.value })}
                    placeholder="+47 XXX XX XXX"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/bestillinger')}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={!selectedCustomer && mode !== 'new'}
          >
            Fortsett til booking
          </Button>
        </div>
      </div>
    </form>
  )
}

