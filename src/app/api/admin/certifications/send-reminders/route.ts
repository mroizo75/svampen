// API for å sende påminnelser om utløpende sertifiseringer
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const { daysBeforeExpiry = 30 } = await request.json();

    // Finn sertifiseringer som utløper snart og ikke har fått påminnelse nylig
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysBeforeExpiry);

    const now = new Date();
    const reminderCutoff = new Date();
    reminderCutoff.setDate(reminderCutoff.getDate() - 7); // Ikke send oftere enn hver 7. dag

    const certifications = await prisma.userEquipmentCertification.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gte: now,
          lte: cutoffDate,
        },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: reminderCutoff } },
        ],
      },
      include: {
        user: true,
        equipment: true,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // Send e-post til hver bruker
    for (const cert of certifications) {
      try {
        const daysUntilExpiry = Math.floor(
          (cert.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const emailContent = `
          <h2>Påminnelse: Din opplæringssertifisering utløper snart</h2>
          
          <p>Hei ${cert.user.firstName},</p>
          
          <p>Dette er en påminnelse om at din sertifisering for <strong>${cert.equipment.name}</strong> utløper om <strong>${daysUntilExpiry} dager</strong>.</p>
          
          <p><strong>Sertifikatdetaljer:</strong></p>
          <ul>
            <li>Utstyr: ${cert.equipment.name}</li>
            <li>Nivå: ${cert.certificationLevel}</li>
            <li>Utløpsdato: ${cert.expiresAt!.toLocaleDateString('nb-NO')}</li>
          </ul>
          
          <p>For å fortsette å bruke dette utstyret må du fornye sertifiseringen din før den utløper.</p>
          
          <p>Kontakt din leder eller HMS-ansvarlig for å planlegge ny opplæring.</p>
          
          <p>Med vennlig hilsen,<br>
          HMS-systemet</p>
        `;

        await sendEmail({
          to: cert.user.email,
          subject: `Påminnelse: Sertifisering utløper om ${daysUntilExpiry} dager`,
          html: emailContent,
        });

        // Oppdater reminderSentAt
        await prisma.userEquipmentCertification.update({
          where: { id: cert.id },
          data: { reminderSentAt: new Date() },
        });

        sentCount++;
      } catch (error) {
        console.error(`Feil ved sending av påminnelse til ${cert.user.email}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: `Påminnelser sendt`,
      sent: sentCount,
      failed: failedCount,
      total: certifications.length,
    });
  } catch (error) {
    console.error("Feil ved sending av påminnelser:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende påminnelser" },
      { status: 500 }
    );
  }
}

// GET - Hent statistikk over påminnelser som skal sendes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysBeforeExpiry = parseInt(searchParams.get("daysBeforeExpiry") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysBeforeExpiry);

    const now = new Date();
    const reminderCutoff = new Date();
    reminderCutoff.setDate(reminderCutoff.getDate() - 7);

    const certificationsToRemind = await prisma.userEquipmentCertification.count({
      where: {
        isActive: true,
        expiresAt: {
          gte: now,
          lte: cutoffDate,
        },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: reminderCutoff } },
        ],
      },
    });

    return NextResponse.json({
      count: certificationsToRemind,
      daysBeforeExpiry,
    });
  } catch (error) {
    console.error("Feil ved henting av påminnelsesstatistikk:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente statistikk" },
      { status: 500 }
    );
  }
}

