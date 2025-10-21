import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(vehicleTypes)
  } catch (error) {
    console.error('Error fetching vehicle types:', error)
    return NextResponse.json(
      { message: 'En feil oppstod ved henting av kjøretøy typer' },
      { status: 500 }
    )
  }
}