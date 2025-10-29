'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function AnsattBestillingerPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bestillinger</h1>
          <p className="text-gray-500 mt-1">Oversikt over alle bookinger</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ny booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle bestillinger</CardTitle>
          <CardDescription>
            Her vises alle bookinger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Bookinger kommer snart - bruker samme komponent som admin
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

