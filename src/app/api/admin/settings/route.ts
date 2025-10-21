import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession()

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Define all settings to save
    const settingsToSave = [
      // Business hours
      { key: 'business_hours_start', value: body.business_hours_start || '08:00' },
      { key: 'business_hours_end', value: body.business_hours_end || '16:00' },
      { key: 'booking_advance_days', value: body.booking_advance_days || '90' },
      
      // Contact info
      { key: 'business_name', value: body.business_name || 'Svampen' },
      { key: 'business_phone', value: body.business_phone || '38347470' },
      { key: 'business_email', value: body.business_email || 'joachim@amento.no' },
      { key: 'business_address', value: body.business_address || '' },
      
      // Booking settings
      { key: 'no_show_fee_percentage', value: String(body.no_show_fee_percentage || '0') },
      { key: 'min_advance_booking_hours', value: String(body.min_advance_booking_hours || '24') },
      { key: 'auto_confirm_bookings', value: String(body.auto_confirm_bookings === true) },
      
      // Notifications
      { key: 'notify_admin_new_booking', value: String(body.notify_admin_new_booking !== false) },
      { key: 'notify_customer_confirmation', value: String(body.notify_customer_confirmation !== false) },
      { key: 'notify_customer_reminder', value: String(body.notify_customer_reminder === true) },
    ]

    // Use upsert to create or update each setting
    const promises = settingsToSave.map((setting) =>
      prisma.adminSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
        },
      })
    )

    await Promise.all(promises)

    return NextResponse.json({
      message: 'Innstillinger lagret',
      count: settingsToSave.length,
    })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Kunne ikke lagre innstillinger' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession()

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 403 }
      )
    }

    const settings = await prisma.adminSettings.findMany({
      orderBy: {
        key: 'asc',
      },
    })

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsMap)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente innstillinger' },
      { status: 500 }
    )
  }
}

