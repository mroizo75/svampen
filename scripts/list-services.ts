import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listServices() {
  console.log('📋 Henter alle tjenester fra databasen...\n')
  
  const services = await prisma.service.findMany({
    orderBy: {
      name: 'asc'
    },
    include: {
      servicePrices: {
        include: {
          vehicleType: true
        }
      }
    }
  })

  console.log(`Totalt ${services.length} tjenester funnet:\n`)
  
  services.forEach((service, index) => {
    console.log(`${index + 1}. "${service.name}"`)
    console.log(`   Kategori: ${service.category}`)
    console.log(`   Admin-only: ${service.isAdminOnly ? 'Ja' : 'Nei'}`)
    console.log(`   Varighet: ${service.duration} min`)
    
    if (service.servicePrices.length > 0) {
      console.log(`   Priser:`)
      service.servicePrices.forEach(price => {
        console.log(`     - ${price.vehicleType.name}: kr ${price.price}`)
      })
    } else {
      console.log(`   ⚠️  Ingen priser satt`)
    }
    console.log('')
  })
}

async function main() {
  try {
    await listServices()
  } catch (error) {
    console.error('💥 Feil:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
