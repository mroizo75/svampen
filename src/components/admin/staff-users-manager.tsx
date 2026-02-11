'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, UserPlus, Users } from 'lucide-react'

interface StaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: 'ADMIN' | 'ANSATT' | 'WORKSHOP'
  createdAt: string
}

const roleLabels: Record<StaffUser['role'], string> = {
  ADMIN: 'Administrator',
  ANSATT: 'Ansatt',
  WORKSHOP: 'Verksted',
}

const roleBadgeClasses: Record<StaffUser['role'], string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  ANSATT: 'bg-blue-100 text-blue-800',
  WORKSHOP: 'bg-orange-100 text-orange-800',
}

export function StaffUsersManager() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/customers?role=staff', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Kunne ikke hente systembrukere')
      }

      const responseData = await response.json()
      const users: StaffUser[] = Array.isArray(responseData?.data)
        ? responseData.data
        : []
      setStaff(users)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Kunne ikke hente systembrukere',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const sortedStaff = useMemo(
    () =>
      [...(Array.isArray(staff) ? staff : [])].sort((a, b) =>
        a.firstName.localeCompare(b.firstName, 'nb-NO', { sensitivity: 'base' }),
      ),
    [staff],
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Systembrukere</CardTitle>
          <CardDescription>
            Administrer administratorer, ansatte og verkstedbrukere
          </CardDescription>
        </div>
        <AddStaffDialog onSuccess={fetchStaff} />
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : sortedStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Shield className="h-6 w-6 text-gray-400" />
            <p>Ingen systembrukere er registrert ennå.</p>
            <p>Legg til administratorer eller verkstedbrukere ved behov.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStaff.map((user) => (
              <div
                key={user.id}
                className="flex flex-col rounded-lg border p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <Badge
                      variant="secondary"
                      className={roleBadgeClasses[user.role]}
                    >
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                  <p className="text-gray-600">{user.email}</p>
                  {user.phone && (
                    <p className="text-gray-500">Telefon: {user.phone}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Opprettet{' '}
                    {new Date(user.createdAt).toLocaleDateString('nb-NO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AddStaffDialogProps {
  onSuccess: () => Promise<void>
}

function AddStaffDialog({ onSuccess }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN' as StaffUser['role'],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Noe gikk galt')
      }

      setSuccess('Bruker opprettet')

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'ADMIN',
      })

      await onSuccess()

      setTimeout(() => {
        setOpen(false)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved opprettelse')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return
    setOpen(nextOpen)
    if (!nextOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'ADMIN',
      })
      setError(null)
      setSuccess(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="justify-center">
          <UserPlus className="mr-2 h-4 w-4" />
          Ny systembruker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ny systembruker</DialogTitle>
            <DialogDescription>
              Opprett administratorer, ansatte eller verkstedkontoer.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">Fornavn</Label>
              <Input
                id="staff-first-name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Ola"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Etternavn</Label>
              <Input
                id="staff-last-name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Nordmann"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-email">E-post</Label>
            <Input
              id="staff-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="ola@firma.no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-phone">Telefon</Label>
            <Input
              id="staff-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              placeholder="+47 123 45 678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">Passord (valgfritt)</Label>
            <Input
              id="staff-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="Minimum 6 tegn"
            />
            <p className="text-xs text-gray-500">
              Lar du feltet stå tomt, genererer vi et sikkert passord automatisk.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as StaffUser['role'],
                }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="ANSATT">Ansatt</SelectItem>
                <SelectItem value="WORKSHOP">Verksted (kun kalender)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oppretter...' : 'Opprett bruker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

