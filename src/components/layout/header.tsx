'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  User, 
  LogOut, 
  Settings, 
  Calendar,
  Menu,
  Car,
  Phone,
  Mail
} from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 pl-2">
          <Image src="/logo-svampen.png" alt="Svampen" width={150} height={150} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Hjem
          </Link>
          <Link 
            href="/tjenester" 
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Våre tjenester
          </Link>
          <Link 
            href="/prisliste" 
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Prisliste
          </Link>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/bestill">
              Bestill tid
            </Link>
          </Button>
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Quick Contact */}
          <a 
            href="tel:38347470" 
            className="hidden lg:flex items-center space-x-2 text-sm hover:text-blue-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span className="font-medium">38 34 74 70</span>
          </a>

          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Mine bestillinger
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profil" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {session.user.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logg ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Logg inn</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrer deg</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <Car className="h-6 w-6 text-blue-600" />
                  <span>Svampen</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-8">
                {/* Kontakt info i mobil meny */}
                <div className="pb-4 border-b">
                  <a 
                    href="tel:38347470" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Ring oss</p>
                      <p className="text-lg font-bold text-blue-600">38 34 74 70</p>
                    </div>
                  </a>
                  <a 
                    href="mailto:joachim@amento.no" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mt-2"
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Send e-post</p>
                      <p className="text-sm text-gray-600">joachim@amento.no</p>
                    </div>
                  </a>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col space-y-2">
                  <Link 
                    href="/" 
                    className="text-base font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Hjem
                  </Link>
                  <Link 
                    href="/tjenester" 
                    className="text-base font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Våre tjenester
                  </Link>
                  <Link 
                    href="/prisliste" 
                    className="text-base font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Prisliste
                  </Link>
                  <Link 
                    href="/kontakt" 
                    className="text-base font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Kontakt oss
                  </Link>
                </nav>

                {/* CTA Button */}
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/bestill" onClick={() => setMobileMenuOpen(false)}>
                    Bestill tid nå
                  </Link>
                </Button>

                {/* User actions */}
                {session ? (
                  <div className="pt-4 border-t space-y-2">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Mine bestillinger</span>
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link 
                        href="/admin" 
                        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logg ut</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t space-y-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Logg inn
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Registrer deg
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}