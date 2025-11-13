// Global Map for å holde styr på alle aktive SSE-klienter
export const sseClients = new Map<string, ReadableStreamDefaultController>()

// Funksjon for å sende oppdateringer til alle klienter
export function notifyBookingUpdate() {
  console.log(`📢 Sender booking-oppdatering til ${sseClients.size} klienter...`)
  const message = `data: ${JSON.stringify({ type: 'booking_update', timestamp: Date.now() })}\n\n`
  
  let successCount = 0
  let failCount = 0
  
  sseClients.forEach((controller, clientId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
      successCount++
      console.log(`✅ Sendt til klient ${clientId}`)
    } catch (error) {
      failCount++
      console.error(`❌ Feilet å sende til klient ${clientId}:`, error)
      sseClients.delete(clientId)
    }
  })
  
  console.log(`📊 SSE broadcast: ${successCount} vellykket, ${failCount} feilet`)
}

