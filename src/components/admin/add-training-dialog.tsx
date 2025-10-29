'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface AddTrainingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const TRAINING_LEVELS = [
  { value: 'BASIC', label: 'Grunnleggende' },
  { value: 'INTERMEDIATE', label: 'Selvstendig' },
  { value: 'ADVANCED', label: 'Avansert' },
  { value: 'TRAINER', label: 'Opplærer' },
  { value: 'SUPPLIER', label: 'Leverandør' },
]

export function AddTrainingDialog({ open, onOpenChange, onSuccess }: AddTrainingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [equipment, setEquipment] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    equipmentId: '',
    userId: '',
    certificationLevel: 'BASIC',
    certifiedBy: '',
    certifiedByUserId: '', // For opplæringskjede
    certificationDate: new Date().toISOString().split('T')[0],
    validityDays: '',
    certificateNumber: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      // Hent utstyr
      fetch('/api/admin/equipment')
        .then(res => {
          if (!res.ok) throw new Error('Kunne ikke hente utstyr')
          return res.json()
        })
        .then(data => setEquipment(data))
        .catch(err => {
          console.error('Feil ved henting av utstyr:', err)
          toast.error('Kunne ikke laste utstyr')
        })

      // Hent brukere (kun ADMIN og ANSATT for opplæring)
      fetch('/api/admin/customers?role=staff')
        .then(res => {
          if (!res.ok) throw new Error('Kunne ikke hente brukere')
          return res.json()
        })
        .then(data => setUsers(data))
        .catch(err => {
          console.error('Feil ved henting av brukere:', err)
          toast.error('Kunne ikke laste brukere')
        })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Hvis flere brukere er valgt, opprett sertifikat for hver
      const usersToProcess = selectedUsers.length > 0 ? selectedUsers : [formData.userId]

      if (usersToProcess.length === 0 || !usersToProcess[0]) {
        throw new Error('Velg minst én bruker')
      }

      const promises = usersToProcess.map(userId => {
        const expiresAt = formData.validityDays 
          ? new Date(Date.now() + parseInt(formData.validityDays) * 24 * 60 * 60 * 1000).toISOString()
          : null

        return fetch('/api/admin/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            equipmentId: formData.equipmentId,
            certificationLevel: formData.certificationLevel,
            certifiedBy: formData.certifiedBy,
            certifiedByUserId: formData.certifiedByUserId || null,
            certificationDate: formData.certificationDate,
            expiresAt,
            certificateNumber: formData.certificateNumber,
            notes: formData.notes,
          }),
        })
      })

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(r => !r.ok)

      if (failedResponses.length > 0) {
        throw new Error(`${failedResponses.length} sertifisering(er) feilet`)
      }

      toast.success('Sertifisering(er) opprettet', {
        description: `${usersToProcess.length} bruker(e) ble sertifisert`,
      })

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        equipmentId: '',
        userId: '',
        certificationLevel: 'BASIC',
        certifiedBy: '',
        certifiedByUserId: '',
        certificationDate: new Date().toISOString().split('T')[0],
        validityDays: '',
        certificateNumber: '',
        notes: '',
      })
      setSelectedUsers([])
    } catch (error: any) {
      toast.error('Feil', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer opplæring og sertifisering</DialogTitle>
          <DialogDescription>
            Sertifiser én eller flere brukere på utstyr
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Utstyr og nivå */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentId">Utstyr *</Label>
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg utstyr" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificationLevel">Opplæringsnivå *</Label>
              <Select
                value={formData.certificationLevel}
                onValueChange={(value) => setFormData({ ...formData, certificationLevel: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Brukervalg */}
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Enkelt bruker</TabsTrigger>
              <TabsTrigger value="multiple">Flere brukere</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-2">
              <Label htmlFor="userId">Bruker *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => {
                  setFormData({ ...formData, userId: value })
                  setSelectedUsers([])
                }}
                required={selectedUsers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg bruker" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="multiple" className="space-y-2">
              <Label>Velg brukere ({selectedUsers.length} valgt)</Label>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => {
                        toggleUser(user.id)
                        setFormData({ ...formData, userId: '' })
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                      {user.firstName} {user.lastName} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Sertifikatdetaljer */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certifiedBy">Sertifisert av (navn) *</Label>
                <Input
                  id="certifiedBy"
                  value={formData.certifiedBy}
                  onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
                  required
                  placeholder="F.eks. 'Flex Norge AS' eller 'Ole Hansen'"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifiedByUserId">Intern opplærer (valgfritt)</Label>
                <Select
                  value={formData.certifiedByUserId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, certifiedByUserId: value === 'EXTERNAL' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ekstern leverandør" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXTERNAL">Ekstern leverandør</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certificationDate">Dato *</Label>
                <Input
                  id="certificationDate"
                  type="date"
                  value={formData.certificationDate}
                  onChange={(e) => setFormData({ ...formData, certificationDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Gyldighet (dager)</Label>
              <Input
                id="validityDays"
                type="number"
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                placeholder="365 (la stå tom for evig)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Sertifikatnummer</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                placeholder="Valgfritt"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ekstra informasjon om opplæringen..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oppretter...' : 'Opprett sertifisering'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

