// Cron job for automatiske påminnelser om utløpende sertifiseringer
// Kjør denne daglig for å sende påminnelser
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    // Verifiser at requesten kommer fra Vercel Cron eller har riktig auth
    const authHeader = request.headers.get("authorization");
    
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Finn sertifiseringer som utløper om 30, 14 og 7 dager
    const reminderDays = [30, 14, 7];
    let totalSent = 0;
    let totalFailed = 0;

    for (const days of reminderDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Finn sertifiseringer som utløper på denne dagen
      const certifications = await prisma.userEquipmentCertification.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        include: {
          user: true,
          equipment: true,
        },
      });

      // Send påminnelse til hver bruker
      for (const cert of certifications) {
        try {
          const emailContent = `
            <h2>Påminnelse: Din opplæringssertifisering utløper om ${days} dager</h2>
            
            <p>Hei ${cert.user.firstName},</p>
            
            <p>Dette er en påminnelse om at din sertifisering for <strong>${cert.equipment.name}</strong> utløper om <strong>${days} dager</strong>.</p>
            
            <p><strong>Sertifikatdetaljer:</strong></p>
            <ul>
              <li>Utstyr: ${cert.equipment.name}</li>
              <li>Kategori: ${cert.equipment.category}</li>
              <li>Nivå: ${cert.certificationLevel}</li>
              <li>Utløpsdato: ${cert.expiresAt!.toLocaleDateString('nb-NO', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</li>
            </ul>
            
            ${days === 7 ? '<p><strong>⚠️ Dette er din siste påminnelse!</strong></p>' : ''}
            
            <p>For å fortsette å bruke dette utstyret må du fornye sertifiseringen din før den utløper.</p>
            
            <p><strong>Hva må du gjøre?</strong></p>
            <ol>
              <li>Kontakt din leder eller HMS-ansvarlig</li>
              <li>Planlegg ny opplæring</li>
              <li>Få oppdatert sertifikat etter fullført opplæring</li>
            </ol>
            
            ${cert.equipment.safetyInstructions ? `
              <p><strong>Viktig sikkerhetsinformasjon:</strong><br>
              ${cert.equipment.safetyInstructions}</p>
            ` : ''}
            
            <p>Med vennlig hilsen,<br>
            HMS-systemet</p>
          `;

          await sendEmail({
            to: cert.user.email,
            subject: `⚠️ Sertifisering utløper om ${days} dager - ${cert.equipment.name}`,
            html: emailContent,
          });

          // Oppdater reminderSentAt
          await prisma.userEquipmentCertification.update({
            where: { id: cert.id },
            data: { reminderSentAt: new Date() },
          });

          totalSent++;
        } catch (error) {
          console.error(`Feil ved sending av påminnelse til ${cert.user.email}:`, error);
          totalFailed++;
        }
      }
    }

    // Send også varsel om allerede utløpte sertifiseringer (én gang per uke)
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const expiredCertifications = await prisma.userEquipmentCertification.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: now,
        },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: oneWeekAgo } },
        ],
      },
      include: {
        user: true,
        equipment: true,
      },
    });

    for (const cert of expiredCertifications) {
      try {
        const daysExpired = Math.floor(
          (now.getTime() - cert.expiresAt!.getTime()) / (1000 * 60 * 60 * 24)
        );

        const emailContent = `
          <h2 style="color: #dc2626;">🚫 Din sertifisering har utløpt</h2>
          
          <p>Hei ${cert.user.firstName},</p>
          
          <p style="color: #dc2626;"><strong>Din sertifisering for ${cert.equipment.name} har utløpt for ${daysExpired} dager siden.</strong></p>
          
          <p><strong>⚠️ Du har ikke lenger tillatelse til å bruke dette utstyret!</strong></p>
          
          <p><strong>Sertifikatdetaljer:</strong></p>
          <ul>
            <li>Utstyr: ${cert.equipment.name}</li>
            <li>Kategori: ${cert.equipment.category}</li>
            <li>Utløpt dato: ${cert.expiresAt!.toLocaleDateString('nb-NO')}</li>
          </ul>
          
          <p><strong>Hva må du gjøre nå?</strong></p>
          <ol>
            <li><strong>Slutt å bruke utstyret umiddelbart</strong></li>
            <li>Kontakt din leder eller HMS-ansvarlig</li>
            <li>Planlegg fornyet opplæring</li>
          </ol>
          
          <p style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626;">
            <strong>Viktig:</strong> Bruk av utstyr uten gyldig sertifisering er et brudd på Arbeidsmiljøloven § 4-5 
            og kan medføre ansvar for deg og bedriften.
          </p>
          
          <p>Med vennlig hilsen,<br>
          HMS-systemet</p>
        `;

        await sendEmail({
          to: cert.user.email,
          subject: `🚫 UTLØPT: Sertifisering for ${cert.equipment.name}`,
          html: emailContent,
        });

        // Oppdater reminderSentAt
        await prisma.userEquipmentCertification.update({
          where: { id: cert.id },
          data: { reminderSentAt: new Date() },
        });

        totalSent++;
      } catch (error) {
        console.error(`Feil ved sending av utløpt-varsel til ${cert.user.email}:`, error);
        totalFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Certification reminders sent",
      sent: totalSent,
      failed: totalFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Feil i cron job for sertifiseringspåminnelser:", error);
    return NextResponse.json(
      { error: "Failed to process certification reminders" },
      { status: 500 }
    );
  }
}

