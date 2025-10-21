/**
 * Alternative SMS sending methods for testing
 * Uncomment one at a time in sms.ts to test
 */

// ALTERNATIV 1: Basic Authentication
export async function sendSMS_BasicAuth(apiKey: string, phone: string, message: string) {
  const base64Auth = Buffer.from(`${apiKey}:`).toString('base64')
  
  const response = await fetch('https://api.prosms.se/v1/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: phone,
      text: message,
      senderName: 'Svampen',
    }),
  })
  
  return response
}

// ALTERNATIV 2: API Key i URL
export async function sendSMS_QueryParam(apiKey: string, phone: string, message: string) {
  const response = await fetch(`https://api.prosms.se/v1/sms?apiKey=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: phone,
      text: message,
      senderName: 'Svampen',
    }),
  })
  
  return response
}

// ALTERNATIV 3: API Key i header (ikke Bearer)
export async function sendSMS_ApiKeyHeader(apiKey: string, phone: string, message: string) {
  const response = await fetch('https://api.prosms.se/v1/sms', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: phone,
      text: message,
      senderName: 'Svampen',
    }),
  })
  
  return response
}

// ALTERNATIV 4: Annen URL struktur
export async function sendSMS_AlternativeURL(apiKey: string, phone: string, message: string) {
  const response = await fetch('https://www.prosms.se/api/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver: phone,
      text: message,
      senderName: 'Svampen',
    }),
  })
  
  return response
}

// ALTERNATIV 5: Form-encoded i stedet for JSON
export async function sendSMS_FormEncoded(apiKey: string, phone: string, message: string) {
  const params = new URLSearchParams({
    receiver: phone,
    text: message,
    senderName: 'Svampen',
  })
  
  const response = await fetch('https://api.prosms.se/v1/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  
  return response
}

// ALTERNATIV 6: Med accountId parameter
export async function sendSMS_WithAccountId(apiKey: string, phone: string, message: string, accountId?: string) {
  const response = await fetch('https://api.prosms.se/v1/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountId: accountId,
      receiver: phone,
      text: message,
      senderName: 'Svampen',
    }),
  })
  
  return response
}

// TEST-funksjon for å prøve alle
export async function testAllMethods(apiKey: string, phone: string, message: string) {
  console.log('Testing all authentication methods...')
  
  const methods = [
    { name: 'Bearer Token', fn: async () => sendSMS_BasicAuth(apiKey, phone, message) },
    { name: 'Query Param', fn: async () => sendSMS_QueryParam(apiKey, phone, message) },
    { name: 'API Key Header', fn: async () => sendSMS_ApiKeyHeader(apiKey, phone, message) },
    { name: 'Alternative URL', fn: async () => sendSMS_AlternativeURL(apiKey, phone, message) },
    { name: 'Form Encoded', fn: async () => sendSMS_FormEncoded(apiKey, phone, message) },
  ]
  
  for (const method of methods) {
    try {
      console.log(`\n=== Testing: ${method.name} ===`)
      const response = await method.fn()
      console.log(`Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ SUCCESS!', data)
        return { method: method.name, success: true, data }
      } else {
        const text = await response.text()
        console.log(`❌ Failed:`, text.substring(0, 200))
      }
    } catch (error) {
      console.log(`❌ Error:`, error)
    }
  }
  
  return null
}

