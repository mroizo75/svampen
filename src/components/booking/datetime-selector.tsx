'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { CalendarIcon, Clock, AlertTriangle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface DateTimeSelectorProps {
  selectedDate?: Date
  selectedTime?: string
  totalDuration: number
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
}

export function DateTimeSelector({
  selectedDate,
  selectedTime,
  totalDuration,
  onDateChange,
  onTimeChange,
}: DateTimeSelectorProps) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [specialMessage, setSpecialMessage] = useState<string>('')

  // Fetch available times when date or duration changes
  useEffect(() => {
    if (selectedDate && totalDuration > 0) {
      fetchAvailableTimes()
    }
  }, [selectedDate, totalDuration])

  const fetchAvailableTimes = async () => {
    if (!selectedDate || totalDuration === 0) return

    setLoading(true)
    setSpecialMessage('')
    try {
      const response = await fetch(
        `/api/availability?date=${selectedDate.toISOString().split('T')[0]}&duration=${totalDuration}`
      )
      const data = await response.json()
      setAvailableTimes(data.availableTimes || [])
      
      // Sjekk om det er en spesiell melding fra serveren
      if (data.message) {
        setSpecialMessage(data.message)
      }
    } catch (error) {
      console.error('Error fetching available times:', error)
      setAvailableTimes([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}t ${mins}min`
    } else if (hours > 0) {
      return `${hours}t`
    } else {
      return `${mins}min`
    }
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Duration Info */}
      {totalDuration > 600 ? (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Lang booking ({formatDuration(totalDuration)}):</strong> Dette vil kreve en lang arbeidsdag eller må kanskje deles over flere dager.
            <br />
            Vår arbeidstid er normalt 08:00-16:00, men vi kan tilpasse for spesielle tjenester.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Total tid for alle tjenester:</strong> {formatDuration(totalDuration)}
            <br />
            Vi vil finne et tidsrom som passer for alle dine valgte tjenester.
          </AlertDescription>
        </Alert>
      )}

      {/* Date Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Velg dato
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: nb }) : "Velg en dato"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date)
                  onTimeChange('') // Reset time when date changes
                }
              }}
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today || date.getDay() === 0 || date.getDay() === 6
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Velg starttid
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Henter ledige tider...</span>
            </div>
          ) : availableTimes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableTimes.map((time) => {
                const endTime = calculateEndTime(time, totalDuration)
                const isSelected = selectedTime === time
                
                return (
                  <Button
                    key={time}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTimeChange(time)}
                    className="flex flex-col h-auto py-3"
                  >
                    <div className="font-medium">{time}</div>
                    <div className="text-xs opacity-75">
                      til {endTime}
                    </div>
                  </Button>
                )
              })}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {specialMessage || (
                  <>
                    Ingen ledige tider tilgjengelig for valgt dato med {formatDuration(totalDuration)} varighet.
                    <br />
                    Prøv en annen dato eller reduser antall tjenester.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Selected Time Summary */}
      {selectedDate && selectedTime && (
        <Alert className="bg-green-50 border-green-200">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Valgt tid:</strong> {format(selectedDate, "EEEE d. MMMM yyyy", { locale: nb })} 
            kl. {selectedTime} - {calculateEndTime(selectedTime, totalDuration)}
            <br />
            <strong>Varighet:</strong> {formatDuration(totalDuration)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}