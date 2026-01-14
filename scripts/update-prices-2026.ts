import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Prisliste oppdatering 2026 - ekskl. MVA
const priceUpdates = [
  // Bilforhandler pakker
  { name: 'Bilforhandler,  Demo vask, medium pakke', price: 630.00 },
  { name: 'Bilforhandler,  Ny bil eksklusiv uten motorvask', price: 1650.00 },
  { name: 'Bilforhandler, Brukt bil, Eksklusiv pakken med motorvask og underspyling', price: 2110.00 },
  { name: 'Bilforhandler, Mini-pakken(Utv. vask ) liten bil', price: 249.00 },
  { name: 'Bilforhandler, Storbil minipakke. (Utv. vask)', price: 349.00 },
  
  // Hovedpakker
  { name: 'Eksklusiv-pakken. Liten bil', price: 1752.00 },
  
  // Tilleggstjenester
  { name: 'Henting og bringing innen 4 km', price: 120.00 },
  { name: 'Innvendig rengjøring personbil/liten varebil', price: 640.00 },
  { name: 'Keramisk lakkforsegling. Liten bil', price: 5160.00 },
  { name: 'Keramisk lakkforsegling. Stor bil', price: 5912.00 },
  { name: 'Lakkrens', price: 1360.00 },
  { name: 'Lyktepolering ( pr lykt )', price: 392.00 },
  { name: 'Medium-pakke Utv/innv vask av stor bil', price: 1352.00 },
  { name: 'Medium-pakken: Utvendig / innvendig vask liten bil', price: 952.00 },
  { name: 'Mini-pakken(Utv. vask ) liten bil', price: 276.00 },
  { name: 'Motorvask', price: 160.00 },
  { name: 'OZON -behandling ( luftfjernirng )', price: 552.00 },
  { name: 'Rens av 5 seter', price: 1032.00 },
  { name: 'Rubbing/ripejernirng (1 dør/sjerm )', price: 392.00 },
  { name: 'Rubbing', price: 1520.00 },
  { name: 'Sete eller tepperens ( 5 seter vanlig bil )', price: 1592.00 },
  { name: 'Seterens ( 1 sete )', price: 352.00 },
  { name: 'Storbil eksklusiv-pk (inkl. innv- utv vask)', price: 2360.00 },
  { name: 'Storbil minipakke. (Utv. vask)', price: 396.00 },
  { name: 'Tepperens ( 1 plass )', price: 352.00 },
  { name: 'Tepperens ( 5 seters bil )', price: 960.00 },
  { name: 'Underspyling vanlig liten bil/varebil', price: 160.00 },
  
  // Båt tjenester
  { name: 'Utvendig vask/polering båt på tralle (15-22f)', price: 3040.00 },
  { name: 'Utvendig vask/polering campinvogn/bobil ( 6 - 8 m )', price: 4552.00 },
  { name: 'Utvendig vask/polering campinvogn/bobil ( 8 - 10 m )', price: 5592.00 },
  { name: 'Utvendig vask/polering campinvogn/bobil ( opp til 6m )', price: 3432.00 },
  { name: 'Utvendig-pakke (SUV, CARAVELLE, VAREBIL, MINIBUSS, PICKUP)', price: 1480.00 },
  { name: 'Utvendig-pakke (vanlig liten bil/personbil)', price: 1240.00 },
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
