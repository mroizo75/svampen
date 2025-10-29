'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnsattKalenderPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
        <p className="text-gray-500 mt-1">Oversikt over alle bookinger</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalendervisning</CardTitle>
          <CardDescription>
            Her vises alle bookinger i en kalender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Kalender kommer snart - bruker samme komponent som admin
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

