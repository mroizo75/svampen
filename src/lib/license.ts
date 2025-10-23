/**
 * Lisenssystem for Svampen Booking
 * Validerer mot kksas.no lisenserver
 */

import { prisma } from './prisma'

// Feature flags som kan styres via lisens
export interface LicenseFeatures {
  maxUsers?: number
  maxBookingsPerMonth?: number
  smsNotifications: boolean
  emailNotifications: boolean
  invoicing: boolean
  multiVehicleBooking: boolean
  adminDashboard: boolean
  reporting: boolean
  calendarView: boolean
  customBranding: boolean
}

export interface LicenseStatus {
  isValid: boolean
  isActive: boolean
  expiresAt: Date | null
  features: LicenseFeatures
  customerName: string
  daysUntilExpiry: number | null
  errorMessage?: string
}

// Cache for lisensvalidering (5 minutter)
let licenseCache: {
  status: LicenseStatus | null
  timestamp: number
} = {
  status: null,
  timestamp: 0
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutter
const KKSAS_LICENSE_API = process.env.KKSAS_LICENSE_API_URL || 'https://www.kksas.no/api/product-license/validate'

/**
 * Hent lisens fra database
 */
async function getLicenseFromDB() {
  try {
    const license = await prisma.license.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return license
  } catch (error) {
    console.error('Error fetching license from DB:', error)
    return null
  }
}

/**
 * Valider lisens mot kksas.no
 */
async function validateWithServer(licenseKey: string, validationToken?: string): Promise<{
  isValid: boolean
  features?: LicenseFeatures
  expiresAt?: string
  errorMessage?: string
}> {
  try {
    const response = await fetch(KKSAS_LICENSE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validationToken || ''}`,
      },
      body: JSON.stringify({
        licenseKey,
        domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost',
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      }),
      signal: AbortSignal.timeout(10000), // 10 sekunder timeout
    })

    if (!response.ok) {
      return {
        isValid: false,
        errorMessage: `Server responded with ${response.status}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error validating license with server:', error)
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Parse features fra JSON string
 */
function parseFeatures(featuresJson: string): LicenseFeatures {
  try {
    return JSON.parse(featuresJson) as LicenseFeatures
  } catch (error) {
    // Default features hvis parsing feiler
    return {
      smsNotifications: false,
      emailNotifications: true,
      invoicing: false,
      multiVehicleBooking: true,
      adminDashboard: true,
      reporting: false,
      calendarView: true,
      customBranding: false,
    }
  }
}

/**
 * Sjekk lisensstatus (med caching)
 */
export async function checkLicense(forceRefresh: boolean = false): Promise<LicenseStatus> {
  // Sjekk cache først (hvis ikke force refresh)
  if (!forceRefresh && licenseCache.status && Date.now() - licenseCache.timestamp < CACHE_DURATION) {
    return licenseCache.status
  }

  // Hent lisens fra database
  const license = await getLicenseFromDB()

  if (!license) {
    const status: LicenseStatus = {
      isValid: false,
      isActive: false,
      expiresAt: null,
      features: {
        smsNotifications: false,
        emailNotifications: false,
        invoicing: false,
        multiVehicleBooking: false,
        adminDashboard: false,
        reporting: false,
        calendarView: false,
        customBranding: false,
      },
      customerName: 'Ingen lisens',
      daysUntilExpiry: null,
      errorMessage: 'Ingen lisens funnet. Vennligst konfigurer lisens i admin-panelet.',
    }
    
    // Cache negative result
    licenseCache = { status, timestamp: Date.now() }
    return status
  }

  // Sjekk utløpsdato
  const now = new Date()
  const isExpired = license.expiresAt && license.expiresAt < now
  
  if (isExpired) {
    const status: LicenseStatus = {
      isValid: false,
      isActive: false,
      expiresAt: license.expiresAt,
      features: parseFeatures(license.features),
      customerName: license.customerName || 'Ingen kunde',
      daysUntilExpiry: 0,
      errorMessage: 'Lisensen har utløpt. Vennligst fornye lisensen.',
    }
    
    // Cache expired status
    licenseCache = { status, timestamp: Date.now() }
    return status
  }

  // Valider mot kksas.no (hvis sist validert er mer enn 1 time siden)
  const shouldValidateWithServer = !license.lastValidatedAt || 
    (Date.now() - license.lastValidatedAt.getTime() > 60 * 60 * 1000)

  if (shouldValidateWithServer) {
    const validation = await validateWithServer(license.licenseKey, license.validationToken || undefined)
    
    // Logg validering
    try {
      await prisma.licenseValidationLog.create({
        data: {
          licenseId: license.id,
          isValid: validation.isValid,
          responseData: JSON.stringify(validation),
          errorMessage: validation.errorMessage,
        },
      })

      // Oppdater lisens
      await prisma.license.update({
        where: { id: license.id },
        data: {
          lastValidatedAt: new Date(),
          // Oppdater features hvis server returnerer nye
          features: validation.features ? JSON.stringify(validation.features) : license.features,
          // Oppdater utløpsdato hvis server returnerer ny
          expiresAt: validation.expiresAt ? new Date(validation.expiresAt) : license.expiresAt,
          // Deaktiver hvis validering feiler
          isActive: validation.isValid ? license.isActive : false,
        },
      })

      if (!validation.isValid) {
        const status: LicenseStatus = {
          isValid: false,
          isActive: false,
          expiresAt: license.expiresAt,
          features: parseFeatures(license.features),
          customerName: license.customerName || 'Ingen kunde',
          daysUntilExpiry: license.expiresAt ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
          errorMessage: validation.errorMessage || 'Lisensvalidering feilet',
        }
        
        licenseCache = { status, timestamp: Date.now() }
        return status
      }
    } catch (error) {
      console.error('Error logging license validation:', error)
    }
  }

  // Beregn dager til utløp
  const daysUntilExpiry = license.expiresAt 
    ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const status: LicenseStatus = {
    isValid: true,
    isActive: license.isActive,
    expiresAt: license.expiresAt,
    features: parseFeatures(license.features),
    customerName: license.customerName || 'Ingen kunde',
    daysUntilExpiry,
  }

  // Cache positive result
  licenseCache = { status, timestamp: Date.now() }
  return status
}

/**
 * Sjekk om en bestemt feature er aktivert
 */
export async function hasFeature(feature: keyof LicenseFeatures): Promise<boolean> {
  const license = await checkLicense()
  if (!license.isValid || !license.isActive) {
    return false
  }
  return license.features[feature] === true
}

/**
 * Få lisensstatus for visning i UI
 */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  return await checkLicense()
}

/**
 * Force refresh av lisens (f.eks. etter oppdatering)
 */
export async function refreshLicense(): Promise<LicenseStatus> {
  return await checkLicense(true)
}

/**
 * Aktiver lisens med ny lisenskode
 */
export async function activateLicense(
  licenseKey: string, 
  validationToken: string
): Promise<{ success: boolean; message: string; license?: LicenseStatus }> {
  try {
    console.log('🚀 Starter lisensvalidering mot kksas.no...')
    console.log('🔗 API URL:', KKSAS_LICENSE_API)
    
    // Valider lisenskode mot kksas.no
    const validation = await validateWithServer(licenseKey, validationToken)
    console.log('✅ Validering fullført:', { isValid: validation.isValid, error: validation.errorMessage })
    
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errorMessage || 'Ugyldig lisenskode',
      }
    }

    // Deaktiver eksisterende lisenser
    await prisma.license.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Opprett ny lisens
    const license = await prisma.license.create({
      data: {
        licenseKey,
        validationToken,
        customerName: 'Kunde', // Kan hentes fra validation response
        isActive: true,
        features: JSON.stringify(validation.features || {}),
        expiresAt: validation.expiresAt ? new Date(validation.expiresAt) : null,
        lastValidatedAt: new Date(),
      },
    })

    // Logg aktivering
    await prisma.licenseValidationLog.create({
      data: {
        licenseId: license.id,
        isValid: true,
        responseData: JSON.stringify(validation),
      },
    })

    // Refresh cache
    const status = await refreshLicense()

    return {
      success: true,
      message: 'Lisens aktivert!',
      license: status,
    }
  } catch (error) {
    console.error('Error activating license:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Kunne ikke aktivere lisens',
    }
  }
}

