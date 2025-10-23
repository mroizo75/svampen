/**
 * Structured Data (Schema.org) generator for SEO
 * Hjelper Google å forstå tjenestene våre
 */

interface Service {
  id: string
  name: string
  description: string
  duration: number
  servicePrices: Array<{
    price: number
    vehicleType: {
      name: string
    }
  }>
}

/**
 * Generer LocalBusiness schema
 */
export function generateLocalBusinessSchema(businessInfo: {
  name: string
  phone: string
  email: string
  address: string
  hoursStart: string
  hoursEnd: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://svampen.no/#business',
    name: businessInfo.name,
    description: 'Profesjonell bil- og båtvask med fokus på kvalitet og kundetilfredshet',
    url: 'https://svampen.no',
    telephone: businessInfo.phone,
    email: businessInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.address.split('\n')[0] || '',
      postalCode: businessInfo.address.match(/\d{4}/)?.[0] || '',
      addressCountry: 'NO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      // Legg til faktiske koordinater her
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: businessInfo.hoursStart,
        closes: businessInfo.hoursEnd,
      },
    ],
    priceRange: '$$',
    acceptsReservations: 'True',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Våre tjenester',
      itemListElement: [],
    },
  }
}

/**
 * Generer Service schema for en tjeneste
 */
export function generateServiceSchema(
  service: Service,
  businessName: string,
  businessUrl: string = 'https://svampen.no'
) {
  const minPrice = Math.min(...service.servicePrices.map((p) => p.price))
  const maxPrice = Math.max(...service.servicePrices.map((p) => p.price))

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${businessUrl}/tjenester#${service.id}`,
    serviceType: service.name,
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${businessUrl}/#business`,
      name: businessName,
    },
    areaServed: {
      '@type': 'City',
      name: 'Kristiansand',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${businessUrl}/bestill`,
      servicePhone: '',
      serviceSmsNumber: '',
    },
    offers: service.servicePrices.map((sp) => ({
      '@type': 'Offer',
      price: sp.price,
      priceCurrency: 'NOK',
      description: `${service.name} - ${sp.vehicleType.name}`,
      availability: 'https://schema.org/InStock',
      url: `${businessUrl}/bestill`,
      eligibleCustomerType: sp.vehicleType.name,
    })),
    // Aggregert pris
    aggregateOffer: minPrice !== maxPrice ? {
      '@type': 'AggregateOffer',
      lowPrice: minPrice,
      highPrice: maxPrice,
      priceCurrency: 'NOK',
      availability: 'https://schema.org/InStock',
    } : undefined,
  }
}

/**
 * Generer BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generer ItemList schema for tjenester
 */
export function generateServiceListSchema(
  services: Service[],
  businessName: string,
  businessUrl: string = 'https://svampen.no'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Våre tjenester',
    description: 'Profesjonelle bil- og båtvask tjenester',
    itemListElement: services.map((service, index) => {
      const minPrice = Math.min(...service.servicePrices.map((p) => p.price))
      const maxPrice = Math.max(...service.servicePrices.map((p) => p.price))

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          '@id': `${businessUrl}/tjenester#${service.id}`,
          name: service.name,
          description: service.description,
          provider: {
            '@type': 'Organization',
            name: businessName,
          },
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: minPrice,
            highPrice: maxPrice,
            priceCurrency: 'NOK',
            availability: 'https://schema.org/InStock',
          },
        },
      }
    }),
  }
}

/**
 * Generer Organization schema
 */
export function generateOrganizationSchema(businessInfo: {
  name: string
  phone: string
  email: string
  address: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://svampen.no/#organization',
    name: businessInfo.name,
    url: 'https://svampen.no',
    logo: 'https://svampen.no/logo-svampen.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: businessInfo.phone,
      contactType: 'customer service',
      email: businessInfo.email,
      areaServed: 'NO',
      availableLanguage: ['Norwegian', 'English'],
    },
    sameAs: [
      // Legg til sosiale medier her
      // 'https://www.facebook.com/svampen',
      // 'https://www.instagram.com/svampen',
    ],
  }
}

/**
 * Helper function for å injecte schema i HTML
 */
export function injectStructuredData(schema: object | object[]): string {
  const schemas = Array.isArray(schema) ? schema : [schema]
  
  return schemas
    .map(
      (s) =>
        `<script type="application/ld+json">${JSON.stringify(s, null, 0)}</script>`
    )
    .join('\n')
}

