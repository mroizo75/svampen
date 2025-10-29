'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Car,
  Settings,
  BarChart3,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  Building2,
  Wrench,
  HardHat
} from 'lucide-react'

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Kalender',
    href: '/admin/kalender',
    icon: CalendarDays,
  },
  {
    title: 'Verksted Visning',
    href: '/verksted',
    icon: Wrench,
  },
  {
    title: 'Bestillinger',
    href: '/admin/bestillinger',
    icon: Calendar,
  },
  {
    title: 'Timeplan',
    href: '/admin/timeplan',
    icon: Clock,
  },
  {
    title: 'Kunder',
    href: '/admin/kunder',
    icon: Users,
  },
  {
    title: 'Bedriftskunder',
    href: '/admin/bedriftskunder',
    icon: Building2,
  },
  {
    title: 'Tjenester',
    href: '/admin/tjenester',
    icon: Car,
  },
  {
    title: 'Fakturaer',
    href: '/admin/fakturaer',
    icon: FileText,
  },
  {
    title: 'Rapporter',
    href: '/admin/rapporter',
    icon: BarChart3,
  },
  {
    title: 'Utstyr & Opplæring',
    href: '/admin/utstyr',
    icon: HardHat,
  },
  {
    title: 'Inspeksjonsrapport',
    href: '/admin/utstyr/inspeksjon',
    icon: Shield,
  },
  {
    title: 'SMS Test',
    href: '/admin/sms-test',
    icon: MessageSquare,
  },
  {
    title: 'Innstillinger',
    href: '/admin/innstillinger',
    icon: Settings,
  },
  {
    title: 'Lisensstyring',
    href: '/admin/lisens',
    icon: Shield,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {sidebarNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}