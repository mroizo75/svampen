'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export function CustomerSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search') || ''
  const [query, setQuery] = useState(currentSearch)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('search', query.trim())
    }
    router.push(`/admin/kunder?${params.toString()}`)
  }

  const handleClear = () => {
    setQuery('')
    router.push('/admin/kunder')
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Søk etter navn, e-post eller telefon..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <Button variant="outline" onClick={handleSearch}>
        Filtrer
      </Button>
      {currentSearch && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          Nullstill
        </Button>
      )}
    </div>
  )
}
