'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Calendar,
  User,
  Plus
} from 'lucide-react'

const sidebarNavItems = [
  {
    title: 'Oversikt',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mine bestillinger',
    href: '/dashboard/bestillinger',
    icon: Calendar,
  },
  {
    title: 'Ny bestilling',
    href: '/bestill',
    icon: Plus,
  },
  {
    title: 'Min profil',
    href: '/dashboard/profil',
    icon: User,
  },
]

export function DashboardSidebar() {
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