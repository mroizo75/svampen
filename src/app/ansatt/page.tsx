'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function AnsattDashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    upcomingBookings: 0,
    completedToday: 0,
    pendingBookings: 0,
  })

  useEffect(() => {
    // Hent statistikk
    // TODO: Implementer API-kall
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Oversikt</h1>
        <p className="text-gray-500 mt-1">Velkommen til ansatt-portalen</p>
      </div>

      {/* Statistikk-kort */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">I dag</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">Bestillinger i dag</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kommende</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">Neste 7 dager</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fullført</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Fullført i dag</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venter</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Bekreftes</p>
          </CardContent>
        </Card>
      </div>

      {/* Rask-tilgang */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hurtigtilgang</CardTitle>
            <CardDescription>Ofte brukte funksjoner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/ansatt/bestillinger"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Se alle bestillinger</div>
              <div className="text-sm text-gray-500">Oversikt over kommende jobber</div>
            </a>
            <a
              href="/ansatt/kalender"
              className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Åpne kalender</div>
              <div className="text-sm text-gray-500">Se ukens timeplan</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dagens agenda</CardTitle>
            <CardDescription>Hva skjer i dag</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Ingen bookinger planlagt for i dag</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

