/**
 * Tripletex API Client
 * Dokumentasjon: https://api-test.tripletex.tech/v2-docs/
 */

// Tripletex API konfigurasjon
const TRIPLETEX_API_URL = process.env.TRIPLETEX_API_URL || 'https://api-test.tripletex.tech/v2'
const TRIPLETEX_CONSUMER_TOKEN = process.env.TRIPLETEX_CONSUMER_TOKEN || ''
const TRIPLETEX_EMPLOYEE_TOKEN = process.env.TRIPLETEX_EMPLOYEE_TOKEN || ''
const TRIPLETEX_COMPANY_ID = process.env.TRIPLETEX_COMPANY_ID || ''

interface TripletexCustomer {
  id?: number
  name: string
  organizationNumber?: string
  email?: string
  phoneNumber?: string
  invoiceEmail?: string
  isCustomer: boolean
  category1?: number // Kundekategori
}

interface TripletexInvoiceLine {
  product?: { id: number }
  description: string
  count: number
  unitCostCurrency?: number
  unitPriceExcludingVatCurrency: number
  currency?: { id: number }
  vatType?: { id: number }
  discount?: number
}

interface TripletexInvoice {
  id?: number
  invoiceNumber?: number
  customer: { id: number }
  invoiceDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  orderLines: TripletexInvoiceLine[]
  invoiceRemarks?: string
  ourReference?: { id: number }
  yourReference?: string
  sendType?: 'EMAIL' | 'EHF' | 'AVTALEGIRO' | 'VIPPS' | 'PAPER'
}

interface TripletexProduct {
  id?: number
  number?: string
  name: string
  description?: string
  costExcludingVatCurrency?: number
  priceExcludingVatCurrency?: number
  priceIncludingVatCurrency?: number
  vatType?: { id: number }
  currency?: { id: number }
  isInactive?: boolean
  productUnit?: { id: number }
}

// Hjelperfunksjon for å lage headers
function getHeaders(): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  headers.append('Authorization', `Basic ${Buffer.from(`${TRIPLETEX_CONSUMER_TOKEN}:${TRIPLETEX_EMPLOYEE_TOKEN}`).toString('base64')}`)
  return headers
}

/**
 * Hent eller opprett kunde i Tripletex
 */
export async function getOrCreateCustomer(companyData: {
  name: string
  orgNumber?: string
  email: string
  phone?: string
  invoiceEmail?: string
}): Promise<number> {
  try {
    // Søk etter eksisterende kunde basert på org.nr eller e-post
    let customerId: number | null = null

    if (companyData.orgNumber) {
      const searchResponse = await fetch(
        `${TRIPLETEX_API_URL}/customer?organizationNumber=${encodeURIComponent(companyData.orgNumber)}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      )

      if (searchResponse.ok) {
        const data = await searchResponse.json()
        if (data.values && data.values.length > 0) {
          customerId = data.values[0].id
        }
      }
    }

    // Hvis ikke funnet, opprett ny kunde
    if (!customerId) {
      const customerPayload: TripletexCustomer = {
        name: companyData.name,
        organizationNumber: companyData.orgNumber,
        email: companyData.email,
        phoneNumber: companyData.phone,
        invoiceEmail: companyData.invoiceEmail || companyData.email,
        isCustomer: true,
      }

      const createResponse = await fetch(`${TRIPLETEX_API_URL}/customer`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customerPayload),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(`Failed to create customer: ${JSON.stringify(error)}`)
      }

      const data = await createResponse.json()
      customerId = data.value.id
    }

    if (!customerId) {
      throw new Error('Failed to get or create customer: customerId is null')
    }

    return customerId
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error)
    throw error
  }
}

/**
 * Hent eller opprett produkt i Tripletex
 */
export async function getOrCreateProduct(productData: {
  name: string
  description?: string
  price: number
  vatRate?: number // 25 = 25% mva
}): Promise<number> {
  try {
    // Søk etter eksisterende produkt basert på navn
    const searchResponse = await fetch(
      `${TRIPLETEX_API_URL}/product?name=${encodeURIComponent(productData.name)}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    )

    let productId: number | null = null

    if (searchResponse.ok) {
      const data = await searchResponse.json()
      if (data.values && data.values.length > 0) {
        productId = data.values[0].id
      }
    }

    // Hvis ikke funnet, opprett nytt produkt
    if (!productId) {
      // Hent standard MVA-type (3 = 25% utgående mva)
      const vatTypeId = productData.vatRate === 25 ? 3 : 1 // 1 = Ingen MVA

      const productPayload: TripletexProduct = {
        name: productData.name,
        description: productData.description,
        priceExcludingVatCurrency: productData.price,
        vatType: { id: vatTypeId },
        isInactive: false,
      }

      const createResponse = await fetch(`${TRIPLETEX_API_URL}/product`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productPayload),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(`Failed to create product: ${JSON.stringify(error)}`)
      }

      const data = await createResponse.json()
      productId = data.value.id
    }

    if (!productId) {
      throw new Error('Failed to get or create product: productId is null')
    }

    return productId
  } catch (error) {
    console.error('Error in getOrCreateProduct:', error)
    throw error
  }
}

/**
 * Opprett faktura i Tripletex
 */
export async function createInvoice(invoiceData: {
  customerId: number
  invoiceDate: Date
  dueDate: Date
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    productId?: number
  }>
  remarks?: string
}): Promise<{
  id: number
  invoiceNumber: number
  url: string
  voucherNumber?: number
}> {
  try {
    const invoicePayload: TripletexInvoice = {
      customer: { id: invoiceData.customerId },
      invoiceDate: invoiceData.invoiceDate.toISOString().split('T')[0],
      dueDate: invoiceData.dueDate.toISOString().split('T')[0],
      orderLines: invoiceData.lines.map(line => ({
        description: line.description,
        count: line.quantity,
        unitPriceExcludingVatCurrency: line.unitPrice,
        vatType: { id: 3 }, // 25% utgående mva
        ...(line.productId && { product: { id: line.productId } }),
      })),
      invoiceRemarks: invoiceData.remarks,
      sendType: 'EMAIL',
    }

    const response = await fetch(`${TRIPLETEX_API_URL}/invoice`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(invoicePayload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create invoice: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const invoice = data.value

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      url: `https://tripletex.no/execute/invoiceSearch?invoiceId=${invoice.id}`,
      voucherNumber: invoice.voucher?.id,
    }
  } catch (error) {
    console.error('Error in createInvoice:', error)
    throw error
  }
}

/**
 * Send faktura til kunde via e-post
 */
export async function sendInvoice(invoiceId: number): Promise<boolean> {
  try {
    const response = await fetch(
      `${TRIPLETEX_API_URL}/invoice/${invoiceId}/:send`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          sendType: 'EMAIL',
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error sending invoice:', error)
    return false
  }
}

/**
 * Hent faktura-status fra Tripletex
 */
export async function getInvoiceStatus(invoiceId: number): Promise<{
  status: string
  isPaid: boolean
  paidAmount?: number
  paidDate?: string
}> {
  try {
    const response = await fetch(`${TRIPLETEX_API_URL}/invoice/${invoiceId}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to get invoice status')
    }

    const data = await response.json()
    const invoice = data.value

    return {
      status: invoice.postingState || 'UNKNOWN',
      isPaid: invoice.amountOutstanding === 0,
      paidAmount: invoice.amount - invoice.amountOutstanding,
      paidDate: invoice.paidDate,
    }
  } catch (error) {
    console.error('Error getting invoice status:', error)
    throw error
  }
}

/**
 * Test Tripletex forbindelse
 */
export async function testConnection(): Promise<{
  success: boolean
  companyName?: string
  error?: string
}> {
  try {
    const response = await fetch(`${TRIPLETEX_API_URL}/company/${TRIPLETEX_COMPANY_ID}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `API returned ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      companyName: data.value?.name,
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
    }
  }
}

