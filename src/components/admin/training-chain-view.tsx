'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { User, ArrowDown, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface TrainingChainViewProps {
  equipmentId: string
  data: any
}

export function TrainingChainView({ equipmentId, data }: TrainingChainViewProps) {
  if (!data) return null

  const renderUser = (node: any, level: number = 0) => {
    const isExpired = node.expiresAt && new Date(node.expiresAt) < new Date()
    const isExpiringSoon = node.expiresAt && !isExpired && 
      (new Date(node.expiresAt).getTime() - Date.now()) < (30 * 24 * 60 * 60 * 1000)

    return (
      <div key={node.id} className="space-y-3">
        <Card className={`${isExpired ? 'border-red-300 bg-red-50' : isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 mt-1 text-gray-600" />
                <div>
                  <div className="font-semibold">
                    {node.user.firstName} {node.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{node.user.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{node.level}</Badge>
                    {node.source && (
                      <Badge className="bg-blue-600 text-white">{node.source}</Badge>
                    )}
                    {node.certifiedBy && (
                      <span className="text-xs text-gray-500">
                        Opplært av: {node.certifiedBy}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Sertifisert: {format(new Date(node.certificationDate), 'PP', { locale: nb })}
                    {node.expiresAt && (
                      <>
                        {' • Utløper: '}
                        {format(new Date(node.expiresAt), 'PP', { locale: nb })}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {isExpired ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
            
            {node.training && (
              <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                <span className="font-medium">Kurs:</span> {node.training.title}
                {node.training.provider && (
                  <span> • {node.training.provider.name}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vis brukere som denne personen har trent */}
        {node.trainedUsers && node.trainedUsers.length > 0 && (
          <div className="ml-8 pl-4 border-l-2 border-gray-300 space-y-3">
            <div className="flex items-center text-sm text-gray-500">
              <ArrowDown className="h-4 w-4 mr-2" />
              <span>Har trent {node.trainedUsers.length} person(er)</span>
            </div>
            {node.trainedUsers.map((trainedUser: any) => renderUser(trainedUser, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Opplæringskjede */}
      {data.trainingChain.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Opplæringskjede fra leverandør</h3>
          {data.trainingChain.map((node: any) => renderUser(node))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          Ingen strukturert opplæringskjede registrert ennå
        </div>
      )}

      {/* Separate sertifiseringer (ikke i kjede) */}
      {data.orphanedCertifications.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold">Andre sertifiseringer</h3>
          <div className="space-y-3">
            {data.orphanedCertifications.map((cert: any) => (
              <Card key={cert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 mt-1 text-gray-600" />
                    <div>
                      <div className="font-semibold">
                        {cert.user.firstName} {cert.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{cert.user.email}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{cert.certificationLevel}</Badge>
                        <span className="text-xs text-gray-500">
                          Opplært av: {cert.certifiedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Statistikk */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Statistikk</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Totalt sertifisert:</span>
              <div className="font-bold text-lg">{data.stats.total}</div>
            </div>
            <div>
              <span className="text-gray-600">Aktive:</span>
              <div className="font-bold text-lg text-green-600">{data.stats.active}</div>
            </div>
            <div>
              <span className="text-gray-600">Utløpte:</span>
              <div className="font-bold text-lg text-red-600">{data.stats.expired}</div>
            </div>
            <div>
              <span className="text-gray-600">Leverandøropplært:</span>
              <div className="font-bold text-lg">{data.stats.byLevel.SUPPLIER}</div>
            </div>
            <div>
              <span className="text-gray-600">Opplærere:</span>
              <div className="font-bold text-lg">{data.stats.byLevel.TRAINER}</div>
            </div>
            <div>
              <span className="text-gray-600">Brukere:</span>
              <div className="font-bold text-lg">
                {data.stats.byLevel.BASIC + data.stats.byLevel.INTERMEDIATE + data.stats.byLevel.ADVANCED}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

