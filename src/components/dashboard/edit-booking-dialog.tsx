'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface EditBookingDialogProps {
  bookingId: string
  currentDate: Date
  currentTime: Date
  currentNotes?: string | null
  duration: number
  onSuccess?: () => void
}

export function EditBookingDialog({
  bookingId,
  currentDate,
  currentTime,
  currentNotes,
  duration,
  onSuccess,
}: EditBookingDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])

  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const time = new Date(currentTime)
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  const [notes, setNotes] = useState(currentNotes || '')
  const [error, setError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedDate(currentDate)
    const time = new Date(currentTime)
    setSelectedTime(
      `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
    )
    setNotes(currentNotes || '')
    setError(null)
    setAvailabilityError(null)
    fetchAvailableTimes(currentDate)
  }, [open, currentDate, currentTime, currentNotes])

  const fetchAvailableTimes = async (date: Date) => {
    setCheckingAvailability(true)
    setAvailabilityError(null)
    try {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const params = new URLSearchParams({ date: formattedDate, duration: String(duration) })
      params.set('excludeBookingId', bookingId)
      const response = await fetch(`/api/availability?${params}`)
      if (!response.ok) {
        throw new Error('Kunne ikke hente tilgjengelige tider')
      }
      const data = await response.json()
      if (data.isClosed) {
        setAvailabilityError(data.message || 'Denne dagen er stengt')
        setAvailableTimes([])
      } else {
        setAvailableTimes(data.availableTimes || [])
        if (!data.availableTimes?.length) {
          setAvailabilityError('Ingen ledige tider denne dagen')
        }
      }
    } catch {
      setAvailabilityError('Kunne ikke sjekke tilgjengelighet')
      setAvailableTimes([])
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      fetchAvailableTimes(date)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          scheduledTime: selectedTime,
          customerNotes: notes || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Kunne ikke oppdatere bestilling')
      }

      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const currentTimeStr = `${new Date(currentTime).getHours().toString().padStart(2, '0')}:${new Date(currentTime).getMinutes().toString().padStart(2, '0')}`
  const hasChanges =
    format(selectedDate, 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd') ||
    selectedTime !== currentTimeStr ||
    notes !== (currentNotes || '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Rediger bestilling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rediger bestilling</DialogTitle>
          <DialogDescription>
            Endre dato, tidspunkt eller merknader til bestillingen din.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Dato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPPP', { locale: nb })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  locale={nb}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {availabilityError && (
              <p className="text-sm text-red-600">{availabilityError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tidspunkt</Label>
            {checkingAvailability ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Sjekker tilgjengelighet...</span>
              </div>
            ) : availableTimes.length > 0 ? (
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg tid" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
            <p className="text-xs text-gray-500">
              Varighet: {Math.floor(duration / 60)}t {duration % 60}min
            </p>
          </div>

          <div className="space-y-2">
            <Label>Merknader (valgfritt)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spesielle ønsker eller merknader..."
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !hasChanges}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Lagrer...
              </>
            ) : (
              'Lagre endringer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
