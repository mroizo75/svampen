// API for utstyrsstyring
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent alle utstyr
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
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const requiresTraining = searchParams.get("requiresTraining");

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (requiresTraining !== null) {
      where.requiresTraining = requiresTraining === "true";
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        trainingSessions: {
          include: {
            provider: true,
            certifications: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            trainingDate: "desc",
          },
        },
        userCertifications: {
          where: {
            isActive: true,
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
            training: true,
          },
        },
        maintenanceLogs: {
          orderBy: {
            performedDate: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Beregn statistikk for hvert utstyr
    const equipmentWithStats = equipment.map((eq) => {
      const certifiedUsers = eq.userCertifications.filter(
        (cert) => cert.isActive
      ).length;

      const expiringCertifications = eq.userCertifications.filter((cert) => {
        if (!cert.expiresAt || !cert.isActive) return false;
        const daysUntilExpiry = Math.floor(
          (cert.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      }).length;

      const expiredCertifications = eq.userCertifications.filter((cert) => {
        if (!cert.expiresAt) return false;
        return cert.expiresAt.getTime() < Date.now() && cert.isActive;
      }).length;

      return {
        ...eq,
        stats: {
          certifiedUsers,
          expiringCertifications,
          expiredCertifications,
        },
      };
    });

    return NextResponse.json(equipmentWithStats);
  } catch (error) {
    console.error("Feil ved henting av utstyr:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente utstyr" },
      { status: 500 }
    );
  }
}

// POST - Opprett nytt utstyr
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
    if (!data.name || !data.category) {
      return NextResponse.json(
        { error: "Navn og kategori er påkrevd" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        category: data.category,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        description: data.description,
        location: data.location,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpiresAt: data.warrantyExpiresAt ? new Date(data.warrantyExpiresAt) : null,
        requiresTraining: data.requiresTraining ?? true,
        trainingValidityDays: data.trainingValidityDays,
        minimumTrainingLevel: data.minimumTrainingLevel || "BASIC",
        riskAssessment: data.riskAssessment,
        safetyInstructions: data.safetyInstructions,
        emergencyProcedures: data.emergencyProcedures,
        documents: data.documents || [],
        requiresInspection: data.requiresInspection ?? false,
        nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Feil ved opprettelse av utstyr:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette utstyr" },
      { status: 500 }
    );
  }
}

