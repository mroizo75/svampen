import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sseClients } from '@/lib/sse-notifications'

export async function GET(request: NextRequest) {
  // Krever autentisering for SSE stream
  const session = await getServerSession(authOptions)
  
  if (!session || !['ADMIN', 'ANSATT'].includes(session.user.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      // Legg til klient i Map
      sseClients.set(clientId, controller)
      console.log(`SSE client connected: ${clientId}. Total clients: ${sseClients.size}`)

      // Send initial heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
        } catch (error) {
          console.error('Heartbeat failed:', error)
          clearInterval(heartbeat)
          sseClients.delete(clientId)
        }
      }, 30000) // Hver 30 sekund

      // Cleanup når klient kobler fra
      request.signal.addEventListener('abort', () => {
        console.log(`SSE client disconnected: ${clientId}. Remaining clients: ${sseClients.size - 1}`)
        clearInterval(heartbeat)
        sseClients.delete(clientId)
        try {
          controller.close()
        } catch (error) {
          // Allerede lukket
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // For nginx
    },
  })
}

