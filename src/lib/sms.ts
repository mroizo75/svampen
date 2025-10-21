/**
 * SMS sending functionality using proSMS API
 * Documentation: https://docs.prosms.se/
 */

interface SendSMSParams {
  to: string // Phone number with country code, e.g., +4798765432
  message: string
  sender?: string // Optional sender ID
}

interface SendSMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS using proSMS API
 */
export async function sendSMS({ to, message, sender = 'Svampen' }: SendSMSParams): Promise<SendSMSResponse> {
  // Bruker 'Svampen' som godkjent avsendernavn
  const apiKey = process.env.PRO_SMS_API_KEY

  if (!apiKey) {
    console.error('PRO_SMS_API_KEY is not configured in environment variables')
    return {
      success: false,
      error: 'SMS API key is not configured',
    }
  }

  try {
    // Validate phone number format
    const cleanedPhone = to.replace(/\s/g, '')
    if (!cleanedPhone.startsWith('+')) {
      return {
        success: false,
        error: 'Invalid phone number format',
      }
    }

    // Convert phone number to number format (remove + and spaces)
    const receiverNumber = parseInt(cleanedPhone.replace('+', ''))
    
    const requestBody = {
      receiver: receiverNumber,
      senderName: sender,
      message: message,
      format: 'gsm',
      encoding: 'utf8',
    }

    const response = await fetch('https://api.prosms.se/v1/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorJson = null
      
      try {
        errorJson = JSON.parse(errorText)
      } catch {
        // Could not parse as JSON
      }
      
      return {
        success: false,
        error: errorJson?.message || `SMS API error: ${response.status}`,
      }
    }

    const data = await response.json()

    // ProSMS returns success in data.status
    if (data.status === 'success') {
      return {
        success: true,
        messageId: data.result?.report?.accepted?.[0]?.receiver?.toString() || 'sent',
      }
    }

    return {
      success: false,
      error: data.message || 'Unknown error from SMS API',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send booking reminder SMS
 */
export async function sendBookingReminderSMS({
  customerName,
  customerPhone,
  scheduledDate,
  scheduledTime,
  vehicleTypes,
}: {
  customerName: string
  customerPhone: string
  scheduledDate: string
  scheduledTime: string
  vehicleTypes: string[]
}) {
  const date = new Date(scheduledDate)
  const formattedDate = date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const vehicleList = vehicleTypes.join(', ')

  const message = `Hei ${customerName}! 
Påminnelse: Du har time hos Svampen i morgen, ${formattedDate} kl. ${scheduledTime}.

Kjøretøy: ${vehicleList}

Har du spørsmål? Ring oss på 38 34 74 70 eller send e-post til joachim@amento.no

Mvh Svampen`

  return await sendSMS({
    to: customerPhone,
    message: message,
    sender: 'Svampen',
  })
}

/**
 * Send booking confirmation SMS (optional, sent immediately after booking)
 */
export async function sendBookingConfirmationSMS({
  customerName,
  customerPhone,
  scheduledDate,
  scheduledTime,
  bookingId,
}: {
  customerName: string
  customerPhone: string
  scheduledDate: string
  scheduledTime: string
  bookingId: string
}) {
  const date = new Date(scheduledDate)
  const formattedDate = date.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const message = `Hei ${customerName}! 
Din booking hos Svampen er bekreftet!

📅 ${formattedDate} kl. ${scheduledTime}
🔢 Booking-ID: #${bookingId.substring(0, 8)}

Du får en påminnelse dagen før.

Mvh Svampen`

  return await sendSMS({
    to: customerPhone,
    message: message,
    sender: 'Svampen',
  })
}

