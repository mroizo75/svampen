import { Resend } from 'resend'
import { generateICalContent } from './calendar-utils'

// Sjekk om Resend API key er satt
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY er ikke satt! E-post sending vil ikke fungere.')
  console.warn('📝 Opprett en .env.local fil og legg til: RESEND_API_KEY="din-api-key"')
  console.warn('🔑 Få API key fra: https://resend.com/api-keys')
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingEmailData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  customerPostalCode?: string
  customerCity?: string
  bookingId: string
  scheduledDate: string
  scheduledTime: string
  totalDuration: number
  totalPrice: number
  customerNotes?: string
  vehicles: Array<{
    vehicleType: string
    vehicleInfo?: string
    vehicleNotes?: string
    services: Array<{
      name: string
      price: number
    }>
  }>
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Kan ikke sende e-post: RESEND_API_KEY mangler')
      return { success: false, error: 'RESEND_API_KEY er ikke konfigurert' }
    }

    console.log(`📧 Sender booking bekreftelse til ${data.customerEmail}...`)
    
    const formattedDate = new Date(data.scheduledDate).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const hours = Math.floor(data.totalDuration / 60)
    const minutes = data.totalDuration % 60
    const durationText = hours > 0 ? `${hours}t ${minutes}min` : `${minutes}min`

    const vehiclesList = data.vehicles.map((vehicle, idx) => `
      <div style="margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Kjøretøy ${idx + 1}: ${escapeHtml(vehicle.vehicleType)}</h3>
        ${vehicle.vehicleInfo ? `<p style="margin: 0 0 6px 0; color: #4b5563;">Bilinfo: ${escapeHtml(vehicle.vehicleInfo)}</p>` : ''}
        ${vehicle.vehicleNotes ? `<p style="margin: 0 0 6px 0; color: #92400e;">Merknad: ${escapeHtml(vehicle.vehicleNotes)}</p>` : ''}
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          ${vehicle.services.map(service => `
            <li>${escapeHtml(service.name)} - kr ${Number(service.price).toLocaleString()},-</li>
          `).join('')}
        </ul>
      </div>
    `).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bekreftelse på bestilling</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(to right, #2563eb, #1e40af); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Bestilling bekreftet!</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Takk for din bestilling hos Svampen</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px;">Hei ${data.customerName},</p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">
                Din bestilling er nå registrert og bekreftet! Du vil motta en SMS-påminelse dagen før din behandling.
              </p>

              <!-- Booking Details -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📅 Bestillingsdetaljer</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 40%;">Bestillingsnr:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">#${data.bookingId.substring(0, 8)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Dato:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Tid:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${data.scheduledTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Varighet:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${durationText}</td>
                  </tr>
                </table>
              </div>

              <!-- Vehicles & Services -->
              <h2 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">🚗 Kjøretøy og tjenester</h2>
              ${vehiclesList}

              <!-- Total Price -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 5px 0; color: #15803d; font-size: 14px; font-weight: 600;">TOTALPRIS</p>
                <p style="margin: 0; color: #166534; font-size: 32px; font-weight: bold;">kr ${Number(data.totalPrice).toLocaleString()},-</p>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 12px;">Inkl. mva</p>
              </div>

              <!-- Important Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">⚠️ Viktig informasjon</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  Timer som ikke blir benyttet eller ikke møtt vil bli fakturert 50%. 
                  Gi oss beskjed i god tid dersom du må avbestille.
                </p>
              </div>

              <!-- Contact Info -->
              <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">📞 Kontakt oss</h3>
                <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Telefon:</strong> 38 34 74 70
                </p>
                <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>E-post:</strong> joachim@amento.no
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  <strong>Åpningstider:</strong> Man-Fre 08:00-16:00
                </p>
              </div>

              <!-- Calendar Attachment Note -->
              <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  📅 <strong>Legg til i kalender:</strong> Denne e-posten inneholder en kalenderfil (booking.ics) som vedlegg. 
                  Klikk på vedlegget for å legge bookingen direkte inn i kalenderen din!
                </p>
              </div>

              <!-- Google Review Request -->
              <div style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; text-align: center; border: 2px solid #fbbf24;">
                <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: 700;">⭐ Er du fornøyd med oss?</h3>
                <p style="margin: 0 0 20px 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                  Din mening betyr mye! Hjelp andre kunder ved å dele din opplevelse på Google.
                </p>
                <a href="https://g.page/r/YOUR_PLACE_ID/review" 
                   style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  ⭐ Legg igjen en anmeldelse
                </a>
                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 13px;">
                  Det tar bare 30 sekunder!
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Takk for at du valgte Svampen - din profesjonelle partner for bil- og båtpleie!
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Svampen - Profesjonell bil- og båtpleie
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Mer enn 10 års erfaring med kvalitet til konkurransedyktige priser
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Generate iCal attachment
    const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`)
    const endDateTime = new Date(scheduledDateTime.getTime() + data.totalDuration * 60000)
    
    const vehiclesForCalendar = data.vehicles
      .map(v => `${v.vehicleType}: ${v.services.map(s => s.name).join(', ')}`)
      .join('\\n')

    const icalContent = generateICalContent({
      title: `Svampen - ${data.vehicles[0]?.vehicleType || 'Booking'}`,
      description: `Bestilling hos Svampen\\n\\nBestillingsnummer: #${data.bookingId.substring(0, 8)}\\n\\nTjenester:\\n${vehiclesForCalendar}\\n\\nVarighet: ${Math.floor(data.totalDuration / 60)}t ${data.totalDuration % 60}min\\n\\nKontakt: joachim@amento.no eller 38 34 74 70`,
      location: 'Svampen - Adresse her', // Update with actual address
      startTime: scheduledDateTime,
      endTime: endDateTime,
    })

    const result = await resend.emails.send({
      from: 'Svampen Booking <booking@innut.no>',
      to: data.customerEmail,
      subject: `Bestilling bekreftet - ${formattedDate}`,
      html: emailHtml,
      attachments: [
        {
          filename: 'booking.ics',
          content: Buffer.from(icalContent).toString('base64'),
        },
      ],
    })

    console.log(`✅ Booking bekreftelse sendt til ${data.customerEmail}`)
    console.log('📨 Resend response:', JSON.stringify(result, null, 2))
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return { success: false, error }
  }
}

// Admin notifikasjon
export async function sendAdminNotificationEmail(data: BookingEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Kan ikke sende admin e-post: RESEND_API_KEY mangler')
      return { success: false, error: 'RESEND_API_KEY er ikke konfigurert' }
    }

    console.log('📧 Sender admin notifikasjon...')
    
    const formattedDate = new Date(data.scheduledDate).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const hours = Math.floor(data.totalDuration / 60)
    const minutes = data.totalDuration % 60
    const durationText = hours > 0 ? `${hours}t ${minutes}min` : `${minutes}min`

    const vehiclesList = data.vehicles.map((vehicle, idx) => `
      <div style="margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">Kjøretøy ${idx + 1}: ${escapeHtml(vehicle.vehicleType)}</p>
        ${vehicle.vehicleInfo ? `<p style="margin: 0 0 4px 0; color: #475569;">Info: ${escapeHtml(vehicle.vehicleInfo)}</p>` : ''}
        ${vehicle.vehicleNotes ? `<p style="margin: 0 0 4px 0; color: #b45309;">Merknad: ${escapeHtml(vehicle.vehicleNotes)}</p>` : ''}
        <p style="margin: 0; color: #334155;">Tjenester: ${vehicle.services.map(s => escapeHtml(s.name)).join(', ')}</p>
      </div>
    `).join('')

    const customerNotesBlock = data.customerNotes
      ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fde68a;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">Kundemerknad</h3>
          <p style="margin: 0; color: #78350f; line-height: 1.6;">${escapeHtml(data.customerNotes).replace(/\n/g, '<br />')}</p>
        </div>
      `
      : ''

    const addressInfo = data.customerAddress || data.customerPostalCode || data.customerCity
      ? `
            <p><strong>Adresse:</strong> ${data.customerAddress || 'Ikke oppgitt'}</p>
            <p><strong>Postnr/Sted:</strong> ${data.customerPostalCode || ''} ${data.customerCity || ''}</p>
          `
      : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ny bestilling</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
            <h1 style="color: #1f2937; margin-bottom: 20px;">🔔 Ny bestilling mottatt</h1>
            
            <h2 style="color: #2563eb; margin-top: 20px;">Kunde</h2>
            <p><strong>Navn:</strong> ${data.customerName}</p>
            <p><strong>E-post:</strong> ${data.customerEmail}</p>
            ${data.customerPhone ? `<p><strong>Telefon:</strong> ${data.customerPhone}</p>` : ''}
            ${addressInfo}
            
            <h2 style="color: #2563eb; margin-top: 20px;">Bestillingsdetaljer</h2>
            <p><strong>ID:</strong> ${data.bookingId}</p>
            <p><strong>Dato:</strong> ${formattedDate}</p>
            <p><strong>Tid:</strong> ${data.scheduledTime}</p>
            <p><strong>Varighet:</strong> ${durationText}</p>
            
            <h2 style="color: #2563eb; margin-top: 20px;">Kjøretøy og tjenester</h2>
            ${vehiclesList}

            ${customerNotesBlock}
            
            <p style="font-size: 24px; color: #166534; margin-top: 30px;">
              <strong>Total: kr ${Number(data.totalPrice).toLocaleString()},-</strong>
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af;">
                Logg inn på admin-panelet for å bekrefte bestillingen.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'Svampen Booking <booking@innut.no>',
      to: 'ordre@amento.no', // Admin e-post for bestillinger
      subject: `Ny bestilling - ${data.customerName}`,
      html: emailHtml,
    })

    console.log('✅ Admin notifikasjon sendt til ordre@amento.no')
    console.log('📨 Resend response:', JSON.stringify(result, null, 2))
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return { success: false, error }
  }
}

interface InvoiceEmailData {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  bookingId: string
  amount: number
  totalAmount: number
  dueDate: string
  issuedDate: string
  vehicles: Array<{
    vehicleType: string
    services: Array<{
      name: string
      price: number
    }>
  }>
}

// Send faktura e-post til kunde
export async function sendInvoiceEmail(data: InvoiceEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Kan ikke sende faktura e-post: RESEND_API_KEY mangler')
      return { success: false, error: 'RESEND_API_KEY er ikke konfigurert' }
    }

    console.log(`📧 Sender faktura ${data.invoiceNumber} til ${data.customerEmail}...`)
    
    const formattedDueDate = new Date(data.dueDate).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const formattedIssuedDate = new Date(data.issuedDate).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const vehiclesList = data.vehicles.map((vehicle, idx) => `
      <tr>
        <td colspan="3" style="padding: 15px 10px 5px 10px; font-weight: 600; color: #1f2937; border-top: 1px solid #e5e7eb;">
          Kjøretøy ${idx + 1}: ${vehicle.vehicleType}
        </td>
      </tr>
      ${vehicle.services.map(service => `
        <tr>
          <td style="padding: 8px 10px; color: #4b5563;">${service.name}</td>
          <td style="padding: 8px 10px; text-align: right; color: #4b5563;">1</td>
          <td style="padding: 8px 10px; text-align: right; color: #1f2937; font-weight: 500;">
            kr ${Number(service.price).toLocaleString()},-
          </td>
        </tr>
      `).join('')}
    `).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Faktura - ${data.invoiceNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af, #2563eb); padding: 40px 30px; color: white;">
              <h1 style="margin: 0 0 10px 0; font-size: 32px;">FAKTURA</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">${data.invoiceNumber}</p>
            </div>

            <!-- Invoice Info -->
            <div style="padding: 30px;">
              <!-- Company & Customer Info -->
              <table style="width: 100%; margin-bottom: 40px;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px;">FRA:</h3>
                    <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      <strong>Svampen</strong><br>
                      Profesjonell bil- og båtpleie<br>
                      joachim@amento.no<br>
                      38 34 74 70
                    </p>
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px;">TIL:</h3>
                    <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      <strong>${data.customerName}</strong><br>
                      ${data.customerEmail}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Invoice Details -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Fakturadato:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${formattedIssuedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Forfallsdato:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-weight: 700; text-align: right;">${formattedDueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Bestillingsnr:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">#${data.bookingId.substring(0, 8)}</td>
                  </tr>
                </table>
              </div>

              <!-- Line Items -->
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                Tjenester utført
              </h2>
              
              <table style="width: 100%; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px 10px; text-align: left; color: #6b7280; font-size: 14px;">Beskrivelse</th>
                    <th style="padding: 12px 10px; text-align: right; color: #6b7280; font-size: 14px;">Antall</th>
                    <th style="padding: 12px 10px; text-align: right; color: #6b7280; font-size: 14px;">Beløp</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehiclesList}
                </tbody>
              </table>

              <!-- Totals -->
              <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
                <table style="width: 100%; max-width: 350px; margin-left: auto;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 16px;">Subtotal:</td>
                    <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 16px;">
                      kr ${Number(data.amount).toLocaleString()},-
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #1f2937;">
                    <td style="padding: 15px 0 0 0; color: #1f2937; font-size: 20px; font-weight: 700;">TOTAL:</td>
                    <td style="padding: 15px 0 0 0; text-align: right; color: #2563eb; font-size: 24px; font-weight: 700;">
                      kr ${Number(data.totalAmount).toLocaleString()},-
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Payment Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">💳 Betalingsinformasjon</h3>
                <p style="margin: 0 0 10px 0; color: #78350f; font-size: 14px;">
                  Vennligst betal innen <strong>${formattedDueDate}</strong>
                </p>
                <p style="margin: 0; color: #78350f; font-size: 14px;">
                  <strong>Betalingsmetoder:</strong><br>
                  • Vipps: XXXX XX XXX<br>
                  • Bankoverføring: XXXX.XX.XXXXX<br>
                  • Kontant eller kort på stedet
                </p>
              </div>

              <!-- Footer Message -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                  Takk for at du valgte Svampen!
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  Ved spørsmål, kontakt oss på joachim@amento.no eller ring 38 34 74 70
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1f2937; padding: 30px 20px; text-align: center; color: white;">
              <p style="margin: 0 0 10px 0; font-size: 14px;">
                © ${new Date().getFullYear()} Svampen - Profesjonell bil- og båtpleie
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Mer enn 10 års erfaring
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'Svampen Faktura <faktura@innut.no>',
      to: data.customerEmail,
      subject: `Faktura ${data.invoiceNumber} - Svampen`,
      html: emailHtml,
    })

    console.log(`✅ Faktura ${data.invoiceNumber} sendt til ${data.customerEmail}`)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error sending invoice email:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return { success: false, error }
  }
}

// Generic sendEmail function for custom emails
interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Kan ikke sende e-post: RESEND_API_KEY mangler')
      return { success: false, error: 'RESEND_API_KEY er ikke konfigurert' }
    }

    console.log(`📧 Sender e-post til ${options.to}...`)
    
    const result = await resend.emails.send({
      from: options.from || 'Svampen <noreply@innut.no>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    console.log(`✅ E-post sendt til ${options.to}`)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    return { success: false, error }
  }
}