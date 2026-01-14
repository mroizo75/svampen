import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Prisliste oppdatering 2026 - ekskl. MVA
const priceUpdates = [
  // Hovedpakker
  { name: 'Mini-pakke', price: 276.00 },
  { name: 'Medium-pakke', price: 952.00 },  // Vanlig bil
  { name: 'Eksklusiv-pakke', price: 1752.00 },  // Vanlig bil
  { name: 'Utvendig-pakke', price: 1240.00 },  // Vanlig bil
  { name: 'Innvendig rengjøring', price: 640.00 },  // Vanlig bil
  
  // Tilleggstjenester
  { name: 'Henting og bringing (inntil 4 km)', price: 120.00 },
  { name: 'Motorvask', price: 160.00 },
  { name: 'Underspyling', price: 160.00 },
  { name: 'OZON-behandling (luktfjerning)', price: 552.00 },
  { name: 'Seterens (1 enkelt sete)', price: 352.00 },
  { name: 'Tepperens (1 seteplass)', price: 352.00 },
  { name: 'Seterens (5-seters vanlig bil)', price: 1032.00 },
  { name: 'Tepperens (5-seters vanlig bil)', price: 960.00 },
  { name: 'Sete- og tepperens (5-seters vanlig bil)', price: 1592.00 },
  
  // Spesialtjenester
  { name: 'Lakkrens (inkl. Clay)', price: 1360.00 },
  { name: 'Rubbing (hel bil)', price: 1520.00 },
  { name: 'Rubbing/Ripefjerning (pr. dør/skjerm)', price: 392.00 },
  { name: 'Lyktepolering (pr. lykt)', price: 392.00 },
  { name: 'Keramisk lakkforsegling', price: 5160.00 },  // Vanlig bil
  
  // Båt og Bobil
  { name: 'Innv-/utvendig vask og polering (inntil 14 fot)', price: 2850.00 },
  { name: 'Utvendig vask og polering (15-22 fot)', price: 3040.00 },
  { name: 'Utv. vask Camping (opptil 6m)', price: 3432.00 },
  
  // Bilforhandler-pakker (generiske - DEALER kategori)
  { name: 'Bilforhandler, Mini-pakken (Utv. vask) liten bil', price: 249.00 },
  { name: 'Bilforhandler, Storbil minipakke (Utv. vask)', price: 396.00 },
  { name: 'Bilforhandler, Demo vask, medium pakke', price: 630.00 },
  { name: 'Bilforhandler, Ny bil eksklusiv pakken med motorvask', price: 1650.00 },
  { name: 'Bilforhandler, Brukt bil, Eksklusiv pakken med motorvask og underspyling', price: 2110.00 },
]

async function updatePrices() {
  console.log('🔄 Starter prisoppdatering...\n')
  
  let updated = 0
  let notFound = 0
  let errors = 0

  for (const item of priceUpdates) {
    try {
      // Finn tjenesten basert på navn (eksakt match)
      const service = await prisma.service.findFirst({
        where: {
          name: item.name
        },
        include: {
          servicePrices: true
        }
      })

      if (!service) {
        console.log(`⚠️  Fant ikke tjeneste: "${item.name}"`)
        notFound++
        continue
      }

      // Oppdater alle priser for denne tjenesten (alle kjøretøytyper)
      const updateResult = await prisma.servicePrice.updateMany({
        where: {
          serviceId: service.id
        },
        data: {
          price: item.price
        }
      })

      if (updateResult.count > 0) {
        console.log(`✅ Oppdatert: "${service.name}" → kr ${item.price}`)
        updated++
      } else {
        console.log(`⚠️  Ingen priser å oppdatere for: "${service.name}"`)
      }

    } catch (error) {
      console.error(`❌ Feil ved oppdatering av "${item.name}":`, error)
      errors++
    }
  }

  console.log('\n📊 Oppsummering:')
  console.log(`   ✅ Oppdatert: ${updated}`)
  console.log(`   ⚠️  Ikke funnet: ${notFound}`)
  console.log(`   ❌ Feil: ${errors}`)
  console.log(`   📝 Totalt forsøkt: ${priceUpdates.length}`)
}

async function main() {
  try {
    await updatePrices()
  } catch (error) {
    console.error('💥 Kritisk feil:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
