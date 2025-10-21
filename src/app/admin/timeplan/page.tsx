import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getTimeSlots() {
  try {
    // Hent tidsslots for neste 14 dager
    const today = new Date()
    const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: today,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })

    return timeSlots
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return []
  }
}

async function getAdminSettings() {
  try {
    const settings = await prisma.adminSettings.findMany({
      where: {
        key: {
          in: ['business_hours_start', 'business_hours_end', 'booking_advance_days'],
        },
      },
    })

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return {}
  }
}

export default async function AdminTimePlanPage() {
  const timeSlots = await getTimeSlots()
  const settings = await getAdminSettings()

  // Grupper slots etter dato
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    const dateKey = slot.date.toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(slot)
    return acc
  }, {} as Record<string, typeof timeSlots>)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timeplan</h1>
          <p className="text-gray-600">Administrer åpningstider og ledige tidsslots</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Legg til tidsslots
        </Button>
      </div>

      {/* Settings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Åpningstid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.business_hours_start || '08:00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stengetid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.business_hours_end || '16:00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Booking frem i tid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.booking_advance_days || '30'} dager</div>
          </CardContent>
        </Card>
      </div>

      {/* Time Slots by Date */}
      <div className="space-y-6">
        {Object.keys(slotsByDate).length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Ingen tidsslots definert for de neste 14 dagene</p>
                <p className="text-sm text-gray-400 mb-4">
                  Systemet bruker standard åpningstider (08:00-16:00) når ingen spesifikke slots er definert
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Opprett tidsslots
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.keys(slotsByDate).map((dateKey) => {
            const date = new Date(dateKey)
            const slots = slotsByDate[dateKey]
            const availableCount = slots.filter(s => s.isAvailable && !s.isHoliday).length
            const unavailableCount = slots.filter(s => !s.isAvailable || s.isHoliday).length

            return (
              <Card key={dateKey}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <Calendar className="mr-2 h-5 w-5" />
                        {date.toLocaleDateString('nb-NO', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <CardDescription>
                        {availableCount} ledige tider, {unavailableCount} opptatt/stengt
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Rediger dag
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {slots.map((slot) => {
                      const startTime = new Date(slot.startTime)
                      const endTime = new Date(slot.endTime)
                      const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
                      const endString = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`

                      return (
                        <div
                          key={slot.id}
                          className={`p-2 rounded-lg border text-center text-sm ${
                            slot.isHoliday
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : slot.isAvailable
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          <div className="font-medium">{timeString}</div>
                          <div className="text-xs">{endString}</div>
                          {slot.isHoliday && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Helligdag
                            </Badge>
                          )}
                          {!slot.isAvailable && !slot.isHoliday && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Stengt
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {slots.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Ingen spesifikke tider definert</p>
                      <p className="text-xs">Bruker standard åpningstider</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtighandlinger</CardTitle>
          <CardDescription>Vanlige timeplan-oppgaver</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <Plus className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Opprett tidsslots</div>
                  <div className="text-sm text-muted-foreground">For spesifikke dager</div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <div className="font-medium">Steng dag</div>
                  <div className="text-sm text-muted-foreground">Marker som helligdag</div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Åpne dag</div>
                  <div className="text-sm text-muted-foreground">Aktiver stengte tider</div>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <Edit className="h-5 w-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">Endre åpningstider</div>
                  <div className="text-sm text-muted-foreground">Standard tider</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}