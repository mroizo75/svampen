import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal,
  Building2,
  Mail,
  Phone,
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Percent,
  FileText
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AddCompanyDialog } from '@/components/admin/add-company-dialog'
import Link from 'next/link'

async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        contactPerson: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Serialize Decimal
    return companies.map(company => ({
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
    }))
  } catch (error) {
    console.error('Error fetching companies:', error)
    return []
  }
}

async function getCompanyStats() {
  try {
    const totalCompanies = await prisma.company.count()

    const activeCompanies = await prisma.company.count({
      where: { isActive: true },
    })

    const companiesWithActiveContracts = await prisma.company.count({
      where: {
        isActive: true,
        OR: [
          { contractEndDate: null }, // Løpende avtaler
          { contractEndDate: { gte: new Date() } }, // Ikke utløpt
        ]
      }
    })

    return {
      totalCompanies,
      activeCompanies,
      companiesWithActiveContracts,
    }
  } catch (error) {
    console.error('Error fetching company stats:', error)
    return {
      totalCompanies: 0,
      activeCompanies: 0,
      companiesWithActiveContracts: 0,
    }
  }
}

function getContractStatusBadge(company: any) {
  if (!company.contractStartDate) {
    return <Badge variant="secondary">Ingen avtale</Badge>
  }

  const now = new Date()
  const startDate = new Date(company.contractStartDate)
  const endDate = company.contractEndDate ? new Date(company.contractEndDate) : null

  if (startDate > now) {
    return <Badge variant="secondary">Ikke startet</Badge>
  }

  if (endDate && endDate < now) {
    return <Badge variant="destructive">Utløpt</Badge>
  }

  if (!endDate) {
    return <Badge className="bg-green-100 text-green-800">Løpende</Badge>
  }

  return <Badge variant="default">Aktiv</Badge>
}

export default async function AdminCompaniesPage() {
  const companies = await getCompanies()
  const stats = await getCompanyStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bedriftskunder</h1>
          <p className="text-gray-600">Administrer bedrifter med fasteavtaler og spesialpriser</p>
        </div>
        <AddCompanyDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale bedrifter</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Registrerte bedrifter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive bedrifter</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCompanies}</div>
            <p className="text-xs text-muted-foreground">
              I drift
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive avtaler</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companiesWithActiveContracts}</div>
            <p className="text-xs text-muted-foreground">
              Med gyldig avtale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Søk og filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Søk etter bedriftsnavn, org.nr eller e-post..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle bedrifter</CardTitle>
          <CardDescription>Oversikt over alle registrerte bedriftskunder</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen bedrifter funnet</p>
              <p className="text-sm text-gray-400 mt-1">Klikk "Legg til bedrift" for å komme i gang</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrift</TableHead>
                    <TableHead>Kontaktinformasjon</TableHead>
                    <TableHead>Avtalestatus</TableHead>
                    <TableHead>Rabatt</TableHead>
                    <TableHead>Bestillinger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                            {company.name}
                          </div>
                          {company.orgNumber && (
                            <div className="text-sm text-gray-500">
                              Org.nr: {company.orgNumber}
                            </div>
                          )}
                          {company.city && (
                            <div className="text-sm text-gray-500">
                              {company.city}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.contactPerson && (
                            <div className="text-sm font-medium">
                              {company.contactPerson.firstName} {company.contactPerson.lastName}
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3 w-3 text-gray-400" />
                            {company.contactEmail}
                          </div>
                          {company.contactPhone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="mr-2 h-3 w-3 text-gray-400" />
                              {company.contactPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getContractStatusBadge(company)}
                        {company.contractEndDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Utløper: {new Date(company.contractEndDate).toLocaleDateString('nb-NO')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.discountPercent > 0 ? (
                          <div className="flex items-center text-green-600 font-medium">
                            <Percent className="h-4 w-4 mr-1" />
                            {company.discountPercent}%
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{company._count.bookings}</div>
                        <div className="text-sm text-gray-500">bookinger</div>
                      </TableCell>
                      <TableCell>
                        {company.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/bedriftskunder/${company.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Se detaljer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/bedriftskunder/${company.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Rediger bedrift
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/bestillinger?companyId=${company.id}`}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Se bestillinger
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className={company.isActive ? "text-orange-600" : "text-green-600"}>
                              {company.isActive ? 'Deaktiver' : 'Aktiver'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

