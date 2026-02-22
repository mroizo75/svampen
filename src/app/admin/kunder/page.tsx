import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Mail, Phone, Calendar, UserPlus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { AddCustomerDialog } from '@/components/admin/add-customer-dialog'
import { CustomerSearch } from '@/components/admin/customer-search'
import { CustomerActionsMenu } from '@/components/admin/customer-actions-menu'
import Link from 'next/link'

const ITEMS_PER_PAGE = 20

async function getCustomers(page: number, search?: string) {
  try {
    const where: Prisma.UserWhereInput = {
      role: 'USER',
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    }
    const totalCount = await prisma.user.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
    const currentPage = Math.min(Math.max(1, page), totalPages)

    const customers = await prisma.user.findMany({
      where,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
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

    return {
      customers: customersWithStats,
      totalCount,
      currentPage,
      totalPages,
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return {
      customers: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
    }
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
    case 'WORKSHOP':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Verksted</Badge>
    default:
      return <Badge variant="secondary">{role}</Badge>
  }
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page, search } = await searchParams
  const requestedPage = Number(page) || 1
  const { customers, totalCount, totalPages, currentPage } = await getCustomers(requestedPage, search)
  const stats = await getCustomerStats()
  const hasCustomers = customers.length > 0
  const showingStart = hasCustomers ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
  const showingEnd = hasCustomers ? showingStart + customers.length - 1 : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600">Administrer kundekontoer og se kunde-aktivitet</p>
        </div>
        <AddCustomerDialog />
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
          {search && (
            <p className="text-sm text-muted-foreground">
              Viser resultater for: <strong>&quot;{search}&quot;</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <CustomerSearch />
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
            <>
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
                          kr {customer.stats.totalSpent.toLocaleString('nb-NO')}
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
                          <CustomerActionsMenu
                            customerId={customer.id}
                            customerName={`${customer.firstName} ${customer.lastName}`}
                            role={customer.role}
                            hasBookings={customer.stats.totalBookings > 0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Viser {showingStart}-{showingEnd} av {totalCount} kunde{totalCount !== 1 ? 'r' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    asChild={currentPage !== 1}
                  >
                    {currentPage === 1 ? (
                      <span>Forrige</span>
                    ) : (
                      <Link href={`/admin/kunder?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>Forrige</Link>
                    )}
                  </Button>
                  <span className="text-sm text-gray-600">
                    Side {currentPage} av {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    asChild={currentPage !== totalPages}
                  >
                    {currentPage === totalPages ? (
                      <span>Neste</span>
                    ) : (
                      <Link href={`/admin/kunder?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}>Neste</Link>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}