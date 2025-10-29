// Global Map for å holde styr på alle aktive SSE-klienter
export const sseClients = new Map<string, ReadableStreamDefaultController>()

// Funksjon for å sende oppdateringer til alle klienter
export function notifyBookingUpdate() {
  const message = `data: ${JSON.stringify({ type: 'booking_update', timestamp: Date.now() })}\n\n`
  
  sseClients.forEach((controller, clientId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      console.error(`Failed to send to client ${clientId}:`, error)
      sseClients.delete(clientId)
    }
  })
}

