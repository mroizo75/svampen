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
import { 
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return invoices
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
}

function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800">Betalt</Badge>
    case 'SENT':
      return <Badge className="bg-blue-100 text-blue-800">Sendt</Badge>
    case 'OVERDUE':
      return <Badge variant="destructive">Forfalt</Badge>
    case 'DRAFT':
      return <Badge variant="secondary">Utkast</Badge>
    case 'CANCELLED':
      return <Badge variant="secondary">Kansellert</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function AdminInvoicesPage() {
  const invoices = await getInvoices()

  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE')
  const paidInvoices = invoices.filter(i => i.status === 'PAID')
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const outstandingAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fakturaer</h1>
        <p className="text-gray-600">Oversikt over alle fakturaer og betalingsstatus</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt betalt</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} betalte fakturaer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utestående</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr {outstandingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidInvoices.length} ubetalte fakturaer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forfalte</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Krever oppfølging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Alle fakturaer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              {overdueInvoices.length} forfalte fakturaer
            </CardTitle>
            <CardDescription className="text-red-700">
              Disse fakturaene har passert forfallsdato og krever oppfølging
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle fakturaer</CardTitle>
          <CardDescription>Oversikt over alle sendte og betalte fakturaer</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen fakturaer funnet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fakturanr</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Fakturadato</TableHead>
                    <TableHead>Forfallsdato</TableHead>
                    <TableHead>Beløp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const isOverdue = invoice.status !== 'PAID' && 
                                     new Date(invoice.dueDate) < new Date()
                    
                    return (
                      <TableRow key={invoice.id} className={isOverdue ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            #{invoice.bookingId.substring(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {invoice.booking.user.firstName} {invoice.booking.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.booking.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.issuedDate).toLocaleDateString('nb-NO')}
                        </TableCell>
                        <TableCell>
                          <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(invoice.dueDate).toLocaleDateString('nb-NO')}
                          </div>
                          {isOverdue && (
                            <div className="text-xs text-red-600">Forfalt</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          kr {Number(invoice.totalAmount).toLocaleString()},-
                        </TableCell>
                        <TableCell>
                          {getInvoiceStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/bestillinger/${invoice.bookingId}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

