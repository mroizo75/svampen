'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function SMSTestForm() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [testType, setTestType] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          testType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          messageId: data.messageId,
        })
      } else {
        setResult({
          success: false,
          message: data.message || data.error || 'Kunne ikke sende SMS',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'En feil oppstod ved sending av test SMS',
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test SMS</CardTitle>
        <CardDescription>
          Send en test-SMS for å verifisere at proSMS-integrasjonen fungerer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefonnummer</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+4798765432"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Må inkludere landskode, f.eks. +47 for Norge
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testType">Type test</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Enkel test-melding</SelectItem>
                <SelectItem value="reminder">Påminnelse-format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
                {result.messageId && (
                  <div className="mt-2 text-xs text-gray-600">
                    Message ID: {result.messageId}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sender SMS...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test SMS
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

