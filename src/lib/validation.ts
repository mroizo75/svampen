import { z } from 'zod'

// Password validation med kompleksitetskrav
export const passwordSchema = z.string()
  .min(8, 'Passordet må være minst 8 tegn')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passordet må inneholde minst én stor bokstav, én liten bokstav og ett tall')

// Email validation
export const emailSchema = z.string()
  .email('Ugyldig e-postadresse')
  .min(1, 'E-post er påkrevd')

// Norsk telefonnummer (8 siffer)
export const phoneSchema = z.string()
  .regex(/^[0-9]{8}$/, 'Telefonnummer må være 8 siffer')
  .optional()
  .or(z.literal(''))

// Norsk postnummer (4 siffer)
export const postalCodeSchema = z.string()
  .regex(/^\d{4}$/, 'Postnummer må være 4 siffer')
  .refine((val) => parseInt(val) <= 9999, 'Ugyldig postnummer')
  .optional()

// Registrering schema
export const registerSchema = z.object({
  firstName: z.string().min(1, 'Fornavn er påkrevd').max(100),
  lastName: z.string().min(1, 'Etternavn er påkrevd').max(100),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
})

// Service schema
export const serviceSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd').max(200),
  description: z.string().min(1, 'Beskrivelse er påkrevd'),
  duration: z.number().int().min(1, 'Varighet må være minst 1 minutt').max(480, 'Varighet kan ikke overstige 8 timer'),
  category: z.enum(['MAIN', 'ADDON', 'SPECIAL', 'DEALER']),
  isActive: z.boolean().optional(),
  isAdminOnly: z.boolean().optional(),
  prices: z.record(z.string(), z.number().nonnegative('Pris må være positiv')).optional(),
})

// Company schema
export const companySchema = z.object({
  name: z.string().min(1, 'Bedriftsnavn er påkrevd').max(200),
  orgNumber: z.string().regex(/^\d{9}$/, 'Organisasjonsnummer må være 9 siffer').optional().or(z.literal('')),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  address: z.string().max(200).optional(),
  postalCode: postalCodeSchema,
  city: z.string().max(100).optional(),
  discountPercent: z.number().min(0, 'Rabatt kan ikke være negativ').max(100, 'Rabatt kan ikke overstige 100%').optional(),
  paymentTerms: z.string().max(100).optional(),
  invoiceEmail: emailSchema.optional(),
  specialTerms: z.string().optional(),
  notes: z.string().optional(),
})

// Customer schema
export const customerSchema = z.object({
  firstName: z.string().min(1, 'Fornavn er påkrevd').max(100),
  lastName: z.string().min(1, 'Etternavn er påkrevd').max(100),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(6).optional(), // Kan være tomt (generer random)
  role: z.enum(['USER', 'ANSATT', 'WORKSHOP', 'ADMIN']).optional(),
})

// Equipment schema
export const equipmentSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd').max(200),
  category: z.string().min(1, 'Kategori er påkrevd').max(100),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  description: z.string().optional(),
  location: z.string().max(200).optional(),
  requiresTraining: z.boolean().optional(),
  trainingValidityDays: z.number().int().min(1, 'Gyldighet må være minst 1 dag').optional(),
  minimumTrainingLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'TRAINER', 'SUPPLIER']).optional(),
  riskAssessment: z.string().optional(),
  safetyInstructions: z.string().optional(),
  emergencyProcedures: z.string().optional(),
  isActive: z.boolean().optional(),
  requiresInspection: z.boolean().optional(),
})

// Closed date schema
export const closedDateSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  reason: z.string().min(1, 'Grunn er påkrevd').max(200),
  type: z.enum(['HOLIDAY', 'VACATION', 'MANUAL', 'OTHER']).optional(),
  isRecurring: z.boolean().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Tid må være i format HH:mm').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Tid må være i format HH:mm').optional(),
})

// Settings schema
export const settingsSchema = z.object({
  key: z.string().min(1, 'Nøkkel er påkrevd'),
  value: z.string(),
})
