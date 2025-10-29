// API for bruker-sertifiseringer
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent alle sertifiseringer
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
    const userId = searchParams.get("userId");
    const equipmentId = searchParams.get("equipmentId");
    const isActive = searchParams.get("isActive");
    const expiringSoon = searchParams.get("expiringSoon"); // Dager til utløp

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const certifications = await prisma.userEquipmentCertification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        equipment: true,
        training: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        certificationDate: "desc",
      },
    });

    let filteredCertifications = certifications;

    // Filtrer på utløpende sertifikater
    if (expiringSoon) {
      const days = parseInt(expiringSoon);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      filteredCertifications = certifications.filter((cert) => {
        if (!cert.expiresAt || !cert.isActive) return false;
        return cert.expiresAt <= cutoffDate && cert.expiresAt > new Date();
      });
    }

    // Legg til status for hver sertifisering
    const certificationsWithStatus = filteredCertifications.map((cert) => {
      let status = "active";
      let daysUntilExpiry = null;

      if (cert.expiresAt) {
        daysUntilExpiry = Math.floor(
          (cert.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          status = "expired";
        } else if (daysUntilExpiry <= 30) {
          status = "expiring_soon";
        }
      }

      if (!cert.isActive) {
        status = "revoked";
      }

      return {
        ...cert,
        status,
        daysUntilExpiry,
      };
    });

    return NextResponse.json(certificationsWithStatus);
  } catch (error) {
    console.error("Feil ved henting av sertifiseringer:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente sertifiseringer" },
      { status: 500 }
    );
  }
}

// POST - Opprett ny sertifisering
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Valider påkrevde felter
    if (!data.userId || !data.equipmentId || !data.certificationLevel || !data.certifiedBy) {
      return NextResponse.json(
        { error: "Bruker, utstyr, nivå og sertifisert av er påkrevd" },
        { status: 400 }
      );
    }

    // Beregn utløpsdato hvis trainingValidityDays er satt
    let expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    if (!expiresAt && data.trainingId) {
      // Hent opplæring for å finne gyldighet
      const training = await prisma.equipmentTraining.findUnique({
        where: { id: data.trainingId },
      });

      if (training?.validityDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + training.validityDays);
      }
    }

    // Hvis ikke fra opplæring, sjekk utstyr
    if (!expiresAt) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: data.equipmentId },
      });

      if (equipment?.trainingValidityDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + equipment.trainingValidityDays);
      }
    }

    const certification = await prisma.userEquipmentCertification.create({
      data: {
        userId: data.userId,
        equipmentId: data.equipmentId,
        trainingId: data.trainingId,
        certificationLevel: data.certificationLevel,
        certifiedBy: data.certifiedBy,
        certifiedByUserId: data.certifiedByUserId || null,
        certificationDate: data.certificationDate ? new Date(data.certificationDate) : new Date(),
        expiresAt,
        certificateNumber: data.certificateNumber,
        certificateDocument: data.certificateDocument,
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        equipment: true,
        training: true,
      },
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Feil ved opprettelse av sertifisering:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette sertifisering" },
      { status: 500 }
    );
  }
}

