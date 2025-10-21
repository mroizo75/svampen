import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'RESEND_API_KEY er ikke satt',
      }, { status: 500 })
    }

    console.log('\n========================================')
    console.log('🔍 RESEND DEBUG - FULLSTENDIG ANALYSE')
    console.log('========================================\n')
    
    const results: any = {
      apiKey: {
        exists: true,
        preview: apiKey.substring(0, 10) + '...',
        length: apiKey.length,
      },
      domains: null,
      emails: null,
      tests: [],
    }

    // 1. Sjekk domener
    console.log('1️⃣ Sjekker domener på kontoen...')
    try {
      const domainsRes = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      const domainsData = await domainsRes.json()
      results.domains = domainsData
      
      console.log('📋 Domener funnet:', JSON.stringify(domainsData, null, 2))
      
      // Sjekk om innut.no er der
      if (domainsData.data) {
        const innutDomain = domainsData.data.find((d: any) => d.name === 'innut.no')
        if (innutDomain) {
          console.log('✅ innut.no er registrert!')
          console.log('   Status:', innutDomain.status)
          console.log('   Region:', innutDomain.region)
        } else {
          console.log('❌ innut.no er IKKE registrert på denne kontoen!')
          console.log('   Tilgjengelige domener:', domainsData.data.map((d: any) => d.name))
        }
      }
    } catch (error) {
      console.error('❌ Feil ved henting av domener:', error)
      results.domains = { error: String(error) }
    }

    // 2. Sjekk siste e-poster
    console.log('\n2️⃣ Sjekker siste e-poster...')
    try {
      const emailsRes = await fetch('https://api.resend.com/emails?limit=5', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      const emailsData = await emailsRes.json()
      results.emails = emailsData
      
      console.log('📧 Siste e-poster:', JSON.stringify(emailsData, null, 2))
    } catch (error) {
      console.error('❌ Feil ved henting av e-poster:', error)
      results.emails = { error: String(error) }
    }

    // 3. Test med onboarding@resend.dev (skal alltid fungere)
    console.log('\n3️⃣ Test #1: Sender med onboarding@resend.dev (standard)...')
    try {
      const testRes1 = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Test <onboarding@resend.dev>',
          to: 'mroizo75@gmail.com',
          subject: 'Test #1: onboarding@resend.dev',
          html: '<h1>Test fra onboarding@resend.dev</h1><p>Hvis du ser denne, fungerer Resend API!</p>',
        }),
      })
      
      const testData1 = await testRes1.json()
      results.tests.push({
        name: 'Test #1: onboarding@resend.dev',
        from: 'onboarding@resend.dev',
        success: testRes1.ok,
        status: testRes1.status,
        response: testData1,
      })
      
      console.log('   Status:', testRes1.status)
      console.log('   Response:', JSON.stringify(testData1, null, 2))
      
      if (testRes1.ok && testData1.id) {
        console.log('   ✅ SUCCESS! E-post ID:', testData1.id)
      } else {
        console.log('   ❌ FEIL:', testData1)
      }
    } catch (error) {
      console.error('   ❌ Exception:', error)
      results.tests.push({
        name: 'Test #1: onboarding@resend.dev',
        error: String(error),
      })
    }

    // 4. Test med booking@innut.no
    console.log('\n4️⃣ Test #2: Sender med booking@innut.no (ditt domene)...')
    try {
      const testRes2 = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Svampen <booking@innut.no>',
          to: 'mroizo75@gmail.com',
          subject: 'Test #2: booking@innut.no',
          html: '<h1>Test fra booking@innut.no</h1><p>Hvis du ser denne, fungerer ditt domene!</p>',
        }),
      })
      
      const testData2 = await testRes2.json()
      results.tests.push({
        name: 'Test #2: booking@innut.no',
        from: 'booking@innut.no',
        success: testRes2.ok,
        status: testRes2.status,
        response: testData2,
      })
      
      console.log('   Status:', testRes2.status)
      console.log('   Response:', JSON.stringify(testData2, null, 2))
      
      if (testRes2.ok && testData2.id) {
        console.log('   ✅ SUCCESS! E-post ID:', testData2.id)
      } else {
        console.log('   ❌ FEIL:', testData2)
      }
    } catch (error) {
      console.error('   ❌ Exception:', error)
      results.tests.push({
        name: 'Test #2: booking@innut.no',
        error: String(error),
      })
    }

    console.log('\n========================================')
    console.log('✅ DEBUG FULLFØRT')
    console.log('========================================\n')

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('❌ Fatal error:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Ukjent feil',
      details: error,
    }, { status: 500 })
  }
}

