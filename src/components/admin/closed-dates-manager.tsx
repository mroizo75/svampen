'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react'
import { getNorwegianHolidays } from '@/lib/norwegian-holidays'

interface ClosedDate {
  id: string
  date: Date
  reason: string
  type: 'HOLIDAY' | 'VACATION' | 'MANUAL' | 'OTHER'
  isRecurring: boolean
  startTime?: string | null
  endTime?: string | null
  createdAt: Date
  updatedAt: Date
}

export function ClosedDatesManager() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('08:00')
  const [newEndTime, setNewEndTime] = useState('16:00')
  const [newReason, setNewReason] = useState('')
  const [newType, setNewType] = useState<'HOLIDAY' | 'VACATION' | 'MANUAL' | 'OTHER'>('MANUAL')
  const [periodStartDate, setPeriodStartDate] = useState('')
  const [periodEndDate, setPeriodEndDate] = useState('')
  const [periodReason, setPeriodReason] = useState('')
  const [periodStartTime, setPeriodStartTime] = useState('08:00')
  const [periodEndTime, setPeriodEndTime] = useState('16:00')

  useEffect(() => {
    fetchClosedDates()
  }, [])

  const fetchClosedDates = async () => {
    try {
      const response = await fetch('/api/admin/closed-dates')
      if (response.ok) {
        const data = await response.json()
        setClosedDates(data.map((d: any) => ({
          ...d,
          // Parse dato uten timezone-konvertering
          date: new Date(String(d.date).split('T')[0] + 'T12:00:00'),
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        })))
      }
    } catch (err) {
      if (err instanceof Error) {
        setError('Kunne ikke laste stengte dager: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const addClosedDate = async () => {
    if (!newDate || !newReason) {
      setError('Dato og grunn må fylles ut')
      return
    }

    if (!newStartTime || !newEndTime) {
      setError('Velg start og sluttid')
      return
    }

    if (newStartTime >= newEndTime) {
      setError('Starttid må være før sluttid')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/closed-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          reason: newReason,
          type: newType,
          isRecurring: false,
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke legge til stengt dag')
      }

      setSuccess('Stengt dag lagt til')
      setNewDate('')
      setNewStartTime('08:00')
      setNewEndTime('16:00')
      setNewReason('')
      setNewType('MANUAL')
      setShowAddForm(false)
      await fetchClosedDates()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const addPeriod = async () => {
    if (!periodStartDate || !periodEndDate || !periodReason) {
      setError('Start, slutt og grunn må fylles ut')
      return
    }

    if (periodStartTime >= periodEndTime) {
      setError('Starttid må være før sluttid')
      return
    }

    const start = new Date(periodStartDate)
    const end = new Date(periodEndDate)

    if (start > end) {
      setError('Startdato må være før sluttdato')
      return
    }

    setSaving(true)
    setError(null)

    try {
      let addedCount = 0
      const currentDate = new Date(start)

      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0]
        
        const response = await fetch('/api/admin/closed-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateString,
            reason: periodReason,
            type: 'VACATION',
            isRecurring: false,
            startTime: periodStartTime,
            endTime: periodEndTime,
          }),
        })

        if (response.ok) {
          addedCount++
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      setSuccess(`${addedCount} dager lagt til som stengt`)
      setPeriodStartDate('')
      setPeriodEndDate('')
      setPeriodReason('')
      setPeriodStartTime('08:00')
      setPeriodEndTime('16:00')
      setShowPeriodForm(false)
      await fetchClosedDates()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteClosedDate = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne stengte dagen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/closed-dates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Kunne ikke slette stengt dag')
      }

      setSuccess('Stengt dag slettet')
      await fetchClosedDates()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const addNorwegianHolidays = async (year: number) => {
    setSaving(true)
    setError(null)

    try {
      const holidays = getNorwegianHolidays(year)
      let addedCount = 0
      let skippedCount = 0

      for (const holiday of holidays) {
        // Format dato som YYYY-MM-DD i lokal tid
        const year = holiday.date.getFullYear()
        const month = String(holiday.date.getMonth() + 1).padStart(2, '0')
        const day = String(holiday.date.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        const response = await fetch('/api/admin/closed-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateString,
            reason: holiday.name,
            type: 'HOLIDAY',
            isRecurring: holiday.isRecurring,
          }),
        })

        if (response.ok) {
          addedCount++
        } else {
          skippedCount++
        }
      }

      if (skippedCount > 0) {
        setSuccess(`${addedCount} helligdager lagt til, ${skippedCount} eksisterte allerede`)
      } else {
        setSuccess(`${addedCount} helligdager lagt til for ${year}`)
      }
      await fetchClosedDates()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HOLIDAY': return 'Helligdag'
      case 'VACATION': return 'Ferie'
      case 'MANUAL': return 'Manuelt stengt'
      case 'OTHER': return 'Annet'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOLIDAY': return 'bg-red-100 text-red-800 border-red-200'
      case 'VACATION': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MANUAL': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'OTHER': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const sortedClosedDates = [...closedDates].sort((a, b) => a.date.getTime() - b.date.getTime())

  const currentYear = new Date().getFullYear()
  const futureClosedDates = sortedClosedDates.filter(d => d.date >= new Date(currentYear, 0, 1))
  const pastClosedDates = sortedClosedDates.filter(d => d.date < new Date(currentYear, 0, 1))

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Laster...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Stengte dager
              </CardTitle>
              <CardDescription>
                Administrer dager bedriften er stengt (helligdager, ferie, etc.)
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNorwegianHolidays(currentYear)}
              disabled={saving}
              className="flex-shrink-0"
            >
              Helligdager {currentYear}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNorwegianHolidays(currentYear + 1)}
              disabled={saving}
              className="flex-shrink-0"
            >
              Helligdager {currentYear + 1}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPeriodForm(!showPeriodForm)
                setShowAddForm(false)
              }}
              className="flex-shrink-0"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Legg til periode
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowAddForm(!showAddForm)
                setShowPeriodForm(false)
              }}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Legg til dag
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-900 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showPeriodForm && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="period-start">Fra dato</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end">Til dato</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                    min={periodStartDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="period-reason">Grunn</Label>
                  <Input
                    id="period-reason"
                    placeholder="F.eks. Sommerferie, Juleferie..."
                    value={periodReason}
                    onChange={(e) => setPeriodReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="period-start-time">Starttid</Label>
                  <Input
                    id="period-start-time"
                    type="time"
                    value={periodStartTime}
                    onChange={(e) => setPeriodStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end-time">Sluttid</Label>
                  <Input
                    id="period-end-time"
                    type="time"
                    value={periodEndTime}
                    onChange={(e) => setPeriodEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={addPeriod}
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Legger til periode...
                    </>
                  ) : (
                    'Legg til periode'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPeriodForm(false)
                    setPeriodStartDate('')
                    setPeriodEndDate('')
                    setPeriodReason('')
                    setPeriodStartTime('08:00')
                    setPeriodEndTime('16:00')
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddForm && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-date">Dato</Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="new-reason">Grunn</Label>
                  <Input
                    id="new-reason"
                    placeholder="F.eks. Sommerferie, Helligdag..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-type">Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                    <SelectTrigger id="new-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manuelt stengt</SelectItem>
                      <SelectItem value="HOLIDAY">Helligdag</SelectItem>
                      <SelectItem value="VACATION">Ferie</SelectItem>
                      <SelectItem value="OTHER">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stengt mellom</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Velg start og slutt for stengt periode</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={addClosedDate}
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    'Legg til'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewDate('')
                    setNewReason('')
                    setNewType('MANUAL')
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Kommende stengte dager</h3>
          {futureClosedDates.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Ingen stengte dager registrert</p>
          ) : (
            <div className="space-y-2">
              {futureClosedDates.map((closedDate) => (
                <div
                  key={closedDate.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {closedDate.date.getDate()}
                      </div>
                      <div className="text-xs text-gray-600 uppercase">
                        {closedDate.date.toLocaleDateString('nb-NO', { month: 'short', timeZone: 'Europe/Oslo' })}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{closedDate.reason}</div>
                      <div className="text-sm text-gray-600">
                        {closedDate.date.toLocaleDateString('nb-NO', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'Europe/Oslo'
                        })}
                      </div>
                      {(closedDate.startTime || closedDate.endTime) && (
                        <div className="text-sm text-gray-500 mt-1">
                          {closedDate.startTime || '00:00'} - {closedDate.endTime || '23:59'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getTypeColor(closedDate.type)}>
                      {getTypeLabel(closedDate.type)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteClosedDate(closedDate.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pastClosedDates.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Tidligere stengte dager</h3>
            <div className="space-y-2">
              {pastClosedDates.slice(-5).reverse().map((closedDate) => (
                <div
                  key={closedDate.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                >
                    <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      {closedDate.date.toLocaleDateString('nb-NO')}
                    </div>
                    <div className="text-sm text-gray-900">{closedDate.reason}</div>
                    {(closedDate.startTime || closedDate.endTime) && (
                      <div className="text-xs text-gray-500">
                        {closedDate.startTime || '00:00'} - {closedDate.endTime || '23:59'}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteClosedDate(closedDate.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

