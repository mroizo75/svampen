import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const emailId = req.nextUrl.searchParams.get('id') || 'db405cb2-bb7d-49bf-a33b-2ccdc7547333'
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'RESEND_API_KEY er ikke satt',
      }, { status: 500 })
    }

    console.log(`\n🔍 Henter status for e-post ID: ${emailId}\n`)
    
    // Hent spesifikk e-post status
    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    const emailData = await emailRes.json()
    
    console.log('📧 E-post detaljer:')
    console.log(JSON.stringify(emailData, null, 2))
    
    if (emailRes.ok) {
      console.log('\n✅ E-post status:', emailData.last_event || 'pending')
      console.log('📬 Til:', emailData.to)
      console.log('📤 Fra:', emailData.from)
      console.log('📅 Sendt:', emailData.created_at)
      
      if (emailData.last_event === 'delivered') {
        console.log('\n🎉 E-POSTEN BLE LEVERT!')
        console.log('✅ Den er i mottakerens innboks!')
      } else if (emailData.last_event === 'bounced') {
        console.log('\n❌ E-posten bounced (returnert)')
      } else if (emailData.last_event === 'complained') {
        console.log('\n⚠️ E-posten ble markert som spam')
      } else {
        console.log('\n⏳ E-posten er fortsatt under levering...')
      }
    } else {
      console.log('\n❌ Kunne ikke hente e-post status')
      console.log('Error:', emailData)
    }
    
    return NextResponse.json({
      success: emailRes.ok,
      email: emailData,
      interpretation: {
        status: emailData.last_event || 'unknown',
        wasDelivered: emailData.last_event === 'delivered',
        recipient: emailData.to,
        sender: emailData.from,
        sentAt: emailData.created_at,
      }
    })
  } catch (error) {
    console.error('❌ Error checking email status:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Ukjent feil',
    }, { status: 500 })
  }
}

