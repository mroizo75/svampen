import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditCompanyForm } from '@/components/admin/edit-company-form'

async function getCompany(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contactPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!company) {
      return null
    }

    return {
      ...company,
      discountPercent: company.discountPercent ? Number(company.discountPercent) : 0,
    }
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

async function getAllUsers() {
  // Hent alle brukere som kan være kontaktperson
  return await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  })
}

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [company, users] = await Promise.all([
    getCompany(id),
    getAllUsers(),
  ])

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <EditCompanyForm company={company} users={users} />
    </div>
  )
}

