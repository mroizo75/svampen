import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starter seeding av database struktur...')

  // Opprett tjenester med kategorier
  const services = [
    // Hovedpakker (MAIN)
    {
      name: 'Mini-pakke',
      description: 'Mini pakken er vår minste pakke med utvendig vask av bilen din.',
      duration: 45, // 45 min
      category: ServiceCategory.MAIN,
    },
    {
      name: 'Medium-pakke',
      description: 'Veldig populær pakke for å holde bilen ren mellom hver polering.',
      duration: 120, // 2 timer (vanlig bil) / 3 timer (SUV)
      category: ServiceCategory.MAIN,
    },
    {
      name: 'Eksklusiv-pakke',
      description: 'Vår desidert BESTSELGENDE pakke med komplett pleie.',
      duration: 210, // 3t 30min
      category: ServiceCategory.MAIN,
    },
    {
      name: 'Utvendig-pakke',
      description: 'Utvendig vask og polering.',
      duration: 120, // 2t (vanlig bil) / 2t 30min (SUV)
      category: ServiceCategory.MAIN,
    },
    {
      name: 'Innvendig rengjøring',
      description: 'Komplett innvendig rengjøring av vanlig bil.',
      duration: 60, // 1 time
      category: ServiceCategory.MAIN,
    },
    {
      name: 'Innvendig rengjøring stor bil',
      description: 'Komplett innvendig rengjøring av SUV/stor bil.',
      duration: 60, // 1 time
      category: ServiceCategory.MAIN,
    },
    
    // Tilleggstjenester (ADDON)
    {
      name: 'Seterens (1 enkelt sete)',
      description: 'Profesjonell rensing av ett enkelt sete.',
      duration: 30, // 30 min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Tepperens (1 seteplass)',
      description: 'Grundig rensing av gulvteppe for en seteplass.',
      duration: 30, // 30 min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Seterens (5-seters vanlig bil)',
      description: 'Profesjonell rensing av alle 5 seter.',
      duration: 90, // 1t 30min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Tepperens (5-seters vanlig bil)',
      description: 'Grundig rensing av alle gulvtepper i 5-seters bil.',
      duration: 90, // 1t 30min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Sete- og tepperens (5-seters vanlig bil)',
      description: 'Komplett rensing av både seter og tepper i 5-seters bil.',
      duration: 120, // 2 timer
      category: ServiceCategory.ADDON,
    },
    {
      name: 'OZON-behandling (luktfjerning)',
      description: 'Effektiv luktfjerning med ozon teknologi.',
      duration: 90, // 1t 30min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Motorvask',
      description: 'Utvendig rens av motorrom.',
      duration: 15, // 15 min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Underspyling',
      description: 'Rensing av bilens understell.',
      duration: 15, // 15 min
      category: ServiceCategory.ADDON,
    },
    {
      name: 'Henting og bringing (inntil 4 km)',
      description: 'Vi henter og bringer bilen din innen 4 km radius.',
      duration: 15, // 15 min
      category: ServiceCategory.ADDON,
    },
    
    // Spesialtjenester (SPECIAL)
    {
      name: 'Lakkrens (inkl. Clay)',
      description: 'Grundig lakkrens med Clay bar behandling.',
      duration: 120, // 2 timer
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Rubbing (hel bil)',
      description: 'Profesjonell rubbing og polering av hele bilen.',
      duration: 180, // 3 timer
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Rubbing/Ripefjerning (pr. dør/skjerm)',
      description: 'Reparasjon av riper på en dør eller skjerm.',
      duration: 30, // 30 min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Lyktepolering (pr. lykt)',
      description: 'Polering av en frontlykt.',
      duration: 30, // 30 min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Keramisk lakkforsegling',
      description: 'Premium keramisk lakkforsegling for langvarig beskyttelse.',
      duration: 330, // 5t 30min (vanlig bil) / 6t (SUV)
      category: ServiceCategory.SPECIAL,
    },
    
    // Båt- og Bobiltjenester
    {
      name: 'Innv-/utvendig vask og polering (inntil 14 fot)',
      description: 'Komplett innvendig og utvendig behandling av båt. Hel dag (8 timer).',
      duration: 480, // 8 timer (full dag)
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Utvendig vask og polering (15-22 fot)',
      description: 'Utvendig vask og polering av større båt. Hel dag (8 timer).',
      duration: 480, // 8 timer (full dag)
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Utv. vask Camping (opptil 6m)',
      description: 'Utvendig vask av campingvogn eller bobil. Hel dag (8 timer). Tillegg kr 250,- pr. ekstra påbegynt meter.',
      duration: 480, // 8 timer (full dag)
      category: ServiceCategory.SPECIAL,
    },
    
    // Bilforhandler-pakker (SPECIAL)
    {
      name: 'Alleen Auto - Eksklusiv pakke med motorv. og underspyling (Liten bil)',
      description: 'Spesialpakke for Alleen Auto - Eksklusiv pakke med motorvask og underspyling.',
      duration: 270, // 4t 30min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Alleen Auto - Eksklusiv pakke med motorv. og underspyling (Stor bil)',
      description: 'Spesialpakke for Alleen Auto - Eksklusiv pakke med motorvask og underspyling.',
      duration: 330, // 5t 30min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Kvavik Auto - Brukt bil, Eksklusiv pakken med motorvask og underspyling',
      description: 'Spesialpakke for Kvavik Auto - Bruktbil behandling.',
      duration: 270, // 4t 30min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Kvavik Auto - Ny bil eksklusiv pakken med motorvask',
      description: 'Spesialpakke for Kvavik Auto - Nybil behandling.',
      duration: 210, // 3t 30min
      category: ServiceCategory.SPECIAL,
    },
    {
      name: 'Kvavik Auto - Demo vask, medium pakke',
      description: 'Spesialpakke for Kvavik Auto - Demobil behandling.',
      duration: 60, // 1 time
      category: ServiceCategory.SPECIAL,
    },
    
    // Generiske Bilforhandler-pakker (DEALER - kun admin)
    {
      name: 'Bilforhandler, Mini-pakken (Utv. vask) liten bil',
      description: 'Utvendig vask for liten bil - Bilforhandlerpakke.',
      duration: 30, // 30 min
      category: ServiceCategory.DEALER,
      isAdminOnly: true,
    },
    {
      name: 'Bilforhandler, Storbil minipakke (Utv. vask)',
      description: 'Utvendig vask for stor bil - Bilforhandlerpakke.',
      duration: 45, // 45 min
      category: ServiceCategory.DEALER,
      isAdminOnly: true,
    },
    {
      name: 'Bilforhandler, Demo vask, medium pakke',
      description: 'Demo vask medium pakke - Bilforhandlerpakke.',
      duration: 60, // 1 time
      category: ServiceCategory.DEALER,
      isAdminOnly: true,
    },
    {
      name: 'Bilforhandler, Ny bil eksklusiv pakken med motorvask',
      description: 'Ny bil behandling med motorvask - Bilforhandlerpakke.',
      duration: 210, // 3t 30min
      category: ServiceCategory.DEALER,
      isAdminOnly: true,
    },
    {
      name: 'Bilforhandler, Brukt bil, Eksklusiv pakken med motorvask og underspyling',
      description: 'Bruktbil behandling med motorvask og underspyling - Bilforhandlerpakke.',
      duration: 270, // 4t 30min
      category: ServiceCategory.DEALER,
      isAdminOnly: true,
    },
  ]

  // Opprett alle tjenester
  for (const service of services as any[]) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service,
    })
  }

  // Opprett kjøretøy typer
  const vehicleTypes = [
    {
      name: 'Vanlig bil/liten varebil',
      description: 'Standard personbil eller liten varebil',
    },
    {
      name: 'SUV/Caravelle/Kassebil/Minibuss',
      description: 'Større kjøretøy som SUV, Caravelle, kassebil eller minibuss',
    },
    {
      name: 'Båt (inntil 14 fot)',
      description: 'Båt på tralle opp til 14 fot',
    },
    {
      name: 'Båt (15-22 fot)',
      description: 'Båt på tralle mellom 15-22 fot',
    },
    {
      name: 'Campingvogn/Bobil (opp til 6m)',
      description: 'Campingvogn eller bobil opp til 6 meter',
    },
  ]

  for (const vehicleType of vehicleTypes) {
    await prisma.vehicleType.upsert({
      where: { name: vehicleType.name },
      update: vehicleType,
      create: vehicleType,
    })
  }

  // Hent opprettede services og vehicle types for prisoppsett
  const allServices = await prisma.service.findMany()
  const allVehicleTypes = await prisma.vehicleType.findMany()

  // Definer priser basert på Svampen's prisliste
  const priceMatrix = [
    // Hovedpakker (MAIN)
    { serviceName: 'Mini-pakke', vehicleName: 'Vanlig bil/liten varebil', price: 345 },
    { serviceName: 'Mini-pakke', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 495 },
    
    { serviceName: 'Medium-pakke', vehicleName: 'Vanlig bil/liten varebil', price: 1049 },
    { serviceName: 'Medium-pakke', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1590 },
    
    { serviceName: 'Eksklusiv-pakke', vehicleName: 'Vanlig bil/liten varebil', price: 1990 },
    { serviceName: 'Eksklusiv-pakke', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 2850 },
    
    { serviceName: 'Utvendig-pakke', vehicleName: 'Vanlig bil/liten varebil', price: 1450 },
    { serviceName: 'Utvendig-pakke', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1750 },
    
    { serviceName: 'Innvendig rengjøring', vehicleName: 'Vanlig bil/liten varebil', price: 750 },
    { serviceName: 'Innvendig rengjøring stor bil', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 890 },
    
    // Tilleggstjenester (ADDON)
    { serviceName: 'Seterens (1 enkelt sete)', vehicleName: 'Vanlig bil/liten varebil', price: 390 },
    { serviceName: 'Seterens (1 enkelt sete)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 390 },
    
    { serviceName: 'Tepperens (1 seteplass)', vehicleName: 'Vanlig bil/liten varebil', price: 390 },
    { serviceName: 'Tepperens (1 seteplass)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 390 },
    
    { serviceName: 'Seterens (5-seters vanlig bil)', vehicleName: 'Vanlig bil/liten varebil', price: 1100 },
    { serviceName: 'Seterens (5-seters vanlig bil)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1100 },
    
    { serviceName: 'Tepperens (5-seters vanlig bil)', vehicleName: 'Vanlig bil/liten varebil', price: 1100 },
    { serviceName: 'Tepperens (5-seters vanlig bil)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1100 },
    
    { serviceName: 'Sete- og tepperens (5-seters vanlig bil)', vehicleName: 'Vanlig bil/liten varebil', price: 1900 },
    { serviceName: 'Sete- og tepperens (5-seters vanlig bil)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1900 },
    
    { serviceName: 'OZON-behandling (luktfjerning)', vehicleName: 'Vanlig bil/liten varebil', price: 650 },
    { serviceName: 'OZON-behandling (luktfjerning)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 650 },
    
    { serviceName: 'Motorvask', vehicleName: 'Vanlig bil/liten varebil', price: 175 },
    { serviceName: 'Motorvask', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 175 },
    
    { serviceName: 'Underspyling', vehicleName: 'Vanlig bil/liten varebil', price: 175 },
    { serviceName: 'Underspyling', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 175 },
    
    { serviceName: 'Henting og bringing (inntil 4 km)', vehicleName: 'Vanlig bil/liten varebil', price: 130 },
    { serviceName: 'Henting og bringing (inntil 4 km)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 130 },
    
    // Spesialtjenester (SPECIAL)
    { serviceName: 'Lakkrens (inkl. Clay)', vehicleName: 'Vanlig bil/liten varebil', price: 1600 },
    { serviceName: 'Lakkrens (inkl. Clay)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1600 },
    
    { serviceName: 'Rubbing (hel bil)', vehicleName: 'Vanlig bil/liten varebil', price: 1600 },
    { serviceName: 'Rubbing (hel bil)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1600 },
    
    { serviceName: 'Rubbing/Ripefjerning (pr. dør/skjerm)', vehicleName: 'Vanlig bil/liten varebil', price: 350 },
    { serviceName: 'Rubbing/Ripefjerning (pr. dør/skjerm)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 350 },
    
    { serviceName: 'Lyktepolering (pr. lykt)', vehicleName: 'Vanlig bil/liten varebil', price: 490 },
    { serviceName: 'Lyktepolering (pr. lykt)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 490 },
    
    { serviceName: 'Keramisk lakkforsegling', vehicleName: 'Vanlig bil/liten varebil', price: 6450 },
    { serviceName: 'Keramisk lakkforsegling', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 7390 },
    
    // Båt- og Bobiltjenester
    { serviceName: 'Innv-/utvendig vask og polering (inntil 14 fot)', vehicleName: 'Båt (inntil 14 fot)', price: 2850 },
    { serviceName: 'Utvendig vask og polering (15-22 fot)', vehicleName: 'Båt (15-22 fot)', price: 3800 },
    { serviceName: 'Utv. vask Camping (opptil 6m)', vehicleName: 'Campingvogn/Bobil (opp til 6m)', price: 3990 },
    
    // Bilforhandler-pakker (spesifikke leverandører)
    { serviceName: 'Alleen Auto - Eksklusiv pakke med motorv. og underspyling (Liten bil)', vehicleName: 'Vanlig bil/liten varebil', price: 2487.50 },
    { serviceName: 'Alleen Auto - Eksklusiv pakke med motorv. og underspyling (Stor bil)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 3612.50 },
    { serviceName: 'Kvavik Auto - Brukt bil, Eksklusiv pakken med motorvask og underspyling', vehicleName: 'Vanlig bil/liten varebil', price: 2487.50 },
    { serviceName: 'Kvavik Auto - Ny bil eksklusiv pakken med motorvask', vehicleName: 'Vanlig bil/liten varebil', price: 1862.50 },
    { serviceName: 'Kvavik Auto - Demo vask, medium pakke', vehicleName: 'Vanlig bil/liten varebil', price: 700 },
    
    // Generiske Bilforhandler-pakker (DEALER kategori - kun admin)
    { serviceName: 'Bilforhandler, Mini-pakken (Utv. vask) liten bil', vehicleName: 'Vanlig bil/liten varebil', price: 249 },
    { serviceName: 'Bilforhandler, Storbil minipakke (Utv. vask)', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 349 },
    { serviceName: 'Bilforhandler, Demo vask, medium pakke', vehicleName: 'Vanlig bil/liten varebil', price: 630 },
    { serviceName: 'Bilforhandler, Demo vask, medium pakke', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 630 },
    { serviceName: 'Bilforhandler, Ny bil eksklusiv pakken med motorvask', vehicleName: 'Vanlig bil/liten varebil', price: 1650 },
    { serviceName: 'Bilforhandler, Ny bil eksklusiv pakken med motorvask', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 1650 },
    { serviceName: 'Bilforhandler, Brukt bil, Eksklusiv pakken med motorvask og underspyling', vehicleName: 'Vanlig bil/liten varebil', price: 2110 },
    { serviceName: 'Bilforhandler, Brukt bil, Eksklusiv pakken med motorvask og underspyling', vehicleName: 'SUV/Caravelle/Kassebil/Minibuss', price: 2110 },
  ]

  // Opprett service prices
  for (const priceEntry of priceMatrix) {
    const service = allServices.find(s => s.name === priceEntry.serviceName)
    const vehicleType = allVehicleTypes.find(vt => vt.name === priceEntry.vehicleName)
    
    if (service && vehicleType) {
      await prisma.servicePrice.upsert({
        where: {
          serviceId_vehicleTypeId: {
            serviceId: service.id,
            vehicleTypeId: vehicleType.id,
          }
        },
        update: {
          price: priceEntry.price,
        },
        create: {
          serviceId: service.id,
          vehicleTypeId: vehicleType.id,
          price: priceEntry.price,
        },
      })
    }
  }

  // Opprett admin settings
  const defaultSettings = [
    // Business hours
    { key: 'business_hours_start', value: '08:00' },
    { key: 'business_hours_end', value: '16:00' },
    { key: 'booking_advance_days', value: '90' },
    
    // Contact info
    { key: 'business_name', value: 'Svampen' },
    { key: 'business_phone', value: '38347470' },
    { key: 'business_email', value: 'joachim@amento.no' },
    { key: 'business_address', value: '' },
    
    // Booking settings
    { key: 'no_show_fee_percentage', value: '0' },
    { key: 'min_advance_booking_hours', value: '24' },
    { key: 'auto_confirm_bookings', value: 'true' },
    
    // Notifications
    { key: 'notify_admin_new_booking', value: 'true' },
    { key: 'notify_customer_confirmation', value: 'true' },
    { key: 'notify_customer_reminder', value: 'true' },
  ]

  for (const setting of defaultSettings) {
    await prisma.adminSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  // Opprett admin bruker
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@svampen.no' },
    update: {},
    create: {
      email: 'admin@svampen.no',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Svampen',
      phone: '+47 12345678',
      role: UserRole.ADMIN,
    },
  })

  // Opprett test bruker
  const testPassword = await bcrypt.hash('test123', 12)
  
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testPassword,
      firstName: 'Test',
      lastName: 'Bruker',
      phone: '+47 87654321',
      role: UserRole.USER,
    },
  })

  console.log('✅ Database seeding fullført!')
  console.log('')
  console.log('📦 Opprettet tjenester (29 totalt):')
  console.log('   🚗 Hovedpakker: Mini, Medium, Eksklusiv, Utvendig, Innvendig (vanlig + stor bil)')
  console.log('   🧽 Tilleggstjenester: Sete/Tepperens, OZON, Motorvask, Underspyling, Henting/bringing')
  console.log('   ✨ Spesialtjenester: Lakkrens, Rubbing, Lyktepolering, Keramisk forsegling')
  console.log('   ⛵ Båt og Bobil: Båtvask (14-22 fot), Campingvask (6m)')
  console.log('   🏢 Bilforhandler: Alleen Auto og Kvavik Auto spesialpakker')
  console.log('')
  console.log('🚙 Kjøretøytyper (5 totalt):')
  console.log('   - Vanlig bil/liten varebil')
  console.log('   - SUV/Caravelle/Kassebil/Minibuss')
  console.log('   - Båt (inntil 14 fot)')
  console.log('   - Båt (15-22 fot)')
  console.log('   - Campingvogn/Bobil (opp til 6m)')
  console.log('')
  console.log('👥 Brukere:')
  console.log('   👨‍💼 Admin: admin@svampen.no / admin123')
  console.log('   👤 Test: test@example.com / test123')
  console.log('')
  console.log('⚙️  Admin innstillinger:')
  console.log('   📅 Booking frem i tid: 90 dager')
  console.log('   📞 Telefon: 38347470')
  console.log('   📧 E-post: joachim@amento.no')
  console.log('   ✅ Automatisk bekreftelse: På')
  console.log('   💰 No-show gebyr: 0%')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })