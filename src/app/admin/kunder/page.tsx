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
  Users,
  Mail,
  Phone,
  Calendar,
  Search,
  UserPlus,
  Eye,
  Edit,
  Shield
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getCustomers() {
  try {
    const customers = await prisma.user.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Beregn statistikk for hver kunde
    const customersWithStats = customers.map(customer => {
      const totalBookings = customer.bookings.length
      const completedBookings = customer.bookings.filter(b => b.status === 'COMPLETED').length
      const totalSpent = customer.bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.totalPrice), 0)
      const lastBooking = customer.bookings.length > 0 
        ? customer.bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null

      return {
        ...customer,
        stats: {
          totalBookings,
          completedBookings,
          totalSpent,
          lastBooking,
        },
      }
    })

    return customersWithStats
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

async function getCustomerStats() {
  try {
    const totalCustomers = await prisma.user.count({
      where: { role: 'USER' },
    })

    const newThisMonth = await prisma.user.count({
      where: {
        role: 'USER',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    const activeCustomers = await prisma.user.count({
      where: {
        role: 'USER',
        bookings: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Siste 30 dager
            },
          },
        },
      },
    })

    return {
      totalCustomers,
      newThisMonth,
      activeCustomers,
    }
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return {
      totalCustomers: 0,
      newThisMonth: 0,
      activeCustomers: 0,
    }
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Admin</Badge>
    case 'USER':
      return <Badge variant="secondary">Kunde</Badge>
    default:
      return <Badge variant="secondary">{role}</Badge>
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers()
  const stats = await getCustomerStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600">Administrer kundekontoer og se kunde-aktivitet</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Legg til kunde
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kunder</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registrerte brukere
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nye denne måneden</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Nye registreringer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive kunder</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Siste 30 dager
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
                placeholder="Søk etter navn, e-post eller telefon..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle kunder</CardTitle>
          <CardDescription>Oversikt over alle registrerte kunder</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen kunder funnet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Bestillinger</TableHead>
                    <TableHead>Totalt brukt</TableHead>
                    <TableHead>Siste bestilling</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Registrert {new Date(customer.createdAt).toLocaleDateString('nb-NO')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3 w-3 text-gray-400" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="mr-2 h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(customer.role)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.stats.totalBookings}</div>
                          <div className="text-sm text-gray-500">
                            {customer.stats.completedBookings} fullført
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        kr {customer.stats.totalSpent.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {customer.stats.lastBooking ? (
                          <div className="text-sm">
                            {new Date(customer.stats.lastBooking.createdAt).toLocaleDateString('nb-NO')}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Aldri</span>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Se detaljer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rediger kunde
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Se bestillinger
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {customer.role === 'USER' && (
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" />
                                Gjør til admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              Deaktiver konto
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