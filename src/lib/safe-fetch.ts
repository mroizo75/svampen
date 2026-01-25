/**
 * Sikker fetch wrapper med feilhåndtering
 */

interface FetchOptions extends RequestInit {
  timeout?: number
}

interface FetchResponse<T> {
  data?: T
  error?: string
  status: number
  ok: boolean
}

/**
 * Sikker fetch med automatisk error handling og timeout
 * @param url URL å hente fra
 * @param options Fetch options
 * @returns Promise med data eller feilmelding
 */
export async function safeFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const { timeout = 30000, ...fetchOptions } = options

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Prøv å parse feilmelding fra server
      let errorMessage = 'En feil oppstod'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Hvis parsing feiler, bruk status text
        errorMessage = response.statusText || errorMessage
      }

      return {
        error: errorMessage,
        status: response.status,
        ok: false,
      }
    }

    // Parse JSON response
    let data: T
    try {
      data = await response.json()
    } catch (error) {
      return {
        error: 'Ugyldig respons fra server',
        status: response.status,
        ok: false,
      }
    }

    return {
      data,
      status: response.status,
      ok: true,
    }
  } catch (error: any) {
    // Håndter network errors, timeout, etc.
    if (error.name === 'AbortError') {
      return {
        error: 'Forespørselen tok for lang tid',
        status: 0,
        ok: false,
      }
    }

    return {
      error: error.message || 'En nettverksfeil oppstod',
      status: 0,
      ok: false,
    }
  }
}

/**
 * POST request med sikker error handling
 */
export async function safePost<T = any>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return safeFetch<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * PATCH request med sikker error handling
 */
export async function safePatch<T = any>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return safeFetch<T>(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request med sikker error handling
 */
export async function safeDelete<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  return safeFetch<T>(url, {
    ...options,
    method: 'DELETE',
  })
}
