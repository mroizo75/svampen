import Link from 'next/link'
import { Car, Phone, Mail, MapPin, Clock } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image src="/logo-svampen-white.png" alt="Svampen" width={150} height={150} />
            </div>
            <p className="text-gray-300 text-sm">
              Vi har mer enn 10 års erfaring og leverer kvalitet til konkurransedyktige priser!
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Clock className="h-4 w-4" />
              <span>Man-Fre: 07:00-15:00</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Hurtiglenker</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tjenester" className="text-gray-300 hover:text-white transition-colors">
                  Våre tjenester
                </Link>
              </li>
              <li>
                <Link href="/prisliste" className="text-gray-300 hover:text-white transition-colors">
                  Prisliste
                </Link>
              </li>
              <li>
                <Link href="/bestill" className="text-gray-300 hover:text-white transition-colors">
                  Bestill tid
                </Link>
              </li>
              <li>
                <Link href="/om-oss" className="text-gray-300 hover:text-white transition-colors">
                  Om Svampen
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Tjenester</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Mini-pakke</li>
              <li>Medium-pakke</li>
              <li>Eksklusiv-pakke</li>
              <li>Polering & Rubbing</li>
              <li>Båtvask</li>
              <li>Bobil/Camping</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kontakt oss</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <a href="tel:38347470" className="hover:text-white transition-colors">
                  38 34 74 70
                </a>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <a href="mailto:ordre@amento.no" className="hover:text-white transition-colors">
                  ordre@amento.no
                </a>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Nye monoddveien 7, 4580 Lyngdal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Svampen. Alle rettigheter forbeholdt.</p>
              <p className="mt-1 text-xs">
                Booking system levert av{' '}
                <a 
                  href="https://www.kksas.no" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  KKS AS - Kurs og Kompetansesystemer
                </a>
              </p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/om-oss" className="hover:text-white transition-colors">
                Om oss
              </Link>
              <Link href="/personvern" className="hover:text-white transition-colors">
                Personvern
              </Link>
              <Link href="/vilkar" className="hover:text-white transition-colors">
                Vilkår
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}