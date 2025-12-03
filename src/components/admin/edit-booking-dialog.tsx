'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface EditBookingDialogProps {
  bookingId: string
  currentDate: Date
  currentTime: Date
  currentStatus: BookingStatus
  currentNotes?: string
  duration: number
}

export function EditBookingDialog({ 
  bookingId, 
  currentDate, 
  currentTime, 
  currentStatus,
  currentNotes,
  duration
}: EditBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    // Sørg for at vi bruker lokal tid
    const time = new Date(currentTime)
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  const [status, setStatus] = useState<BookingStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes || '')
  const [sendNotification, setSendNotification] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Hent tilgjengelige tider når dato endres
  const fetchAvailableTimes = async (date: Date) => {
    setCheckingAvailability(true)
    setAvailabilityError(null)
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/availability?date=${formattedDate}&duration=${duration}`)
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente tilgjengelige tider')
      }
      
      const data = await response.json()
      
      if (data.isClosed) {
        setAvailabilityError(data.message || 'Denne dagen er stengt')
        setAvailableTimes([])
      } else {
        setAvailableTimes(data.availableTimes || [])
        if (data.availableTimes.length === 0) {
          setAvailabilityError('Ingen ledige tider denne dagen')
        }
      }
    } catch (err) {
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
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
          scheduledTime: selectedTime,
          status,
          customerNotes: notes,
          sendNotification,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Kunne ikke oppdatere bestilling')
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Rediger bestilling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger bestilling</DialogTitle>
          <DialogDescription>
            Endre dato, tid, status eller merknader for denne bestillingen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dato */}
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

          {/* Tid */}
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
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full"
              />
            )}
            <p className="text-xs text-gray-500">
              Varighet: {Math.floor(duration / 60)}t {duration % 60}min
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as BookingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Venter</SelectItem>
                <SelectItem value="CONFIRMED">Bekreftet</SelectItem>
                <SelectItem value="IN_PROGRESS">Pågår</SelectItem>
                <SelectItem value="COMPLETED">Fullført</SelectItem>
                <SelectItem value="CANCELLED">Kansellert</SelectItem>
                <SelectItem value="NO_SHOW">Ikke møtt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Merknader */}
          <div className="space-y-2">
            <Label>Merknader</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Legge til merknader..."
              rows={3}
            />
          </div>

          {/* Varsling */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendNotification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
            />
            <Label
              htmlFor="sendNotification"
              className="text-sm font-normal cursor-pointer"
            >
              Send varsel til kunde om endringene (e-post)
            </Label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading || checkingAvailability}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

