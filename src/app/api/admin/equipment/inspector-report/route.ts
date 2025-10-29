// API for inspektør-rapport (Arbeidstilsynet)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Generer komplett inspektør-rapport
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
    const equipmentId = searchParams.get("equipmentId");

    // Hent alt utstyr eller spesifikt utstyr
    const equipmentFilter = equipmentId ? { id: equipmentId } : {};

    const equipment = await prisma.equipment.findMany({
      where: {
        requiresTraining: true,
        ...equipmentFilter,
      },
      include: {
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
                phone: true,
                role: true,
              },
            },
            training: {
              include: {
                provider: true,
              },
            },
          },
        },
        trainingSessions: {
          where: {
            isCompleted: true,
          },
          include: {
            provider: true,
            certifications: true,
          },
          orderBy: {
            trainingDate: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Generer rapport for hvert utstyr
    const report = equipment.map(eq => {
      const activeCerts = eq.userCertifications.filter(cert => {
        if (!cert.expiresAt) return true;
        return cert.expiresAt > new Date();
      });

      const expiredCerts = eq.userCertifications.filter(cert => {
        if (!cert.expiresAt) return false;
        return cert.expiresAt <= new Date();
      });

      const certifiedUsers = activeCerts.map(cert => ({
        name: `${cert.user.firstName} ${cert.user.lastName}`,
        email: cert.user.email,
        phone: cert.user.phone,
        level: cert.certificationLevel,
        certifiedBy: cert.certifiedBy,
        certificationDate: cert.certificationDate,
        expiresAt: cert.expiresAt,
        certificateNumber: cert.certificateNumber,
        daysUntilExpiry: cert.expiresAt
          ? Math.floor((cert.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      }));

      const lastTrainingSession = eq.trainingSessions[0];

      return {
        equipment: {
          name: eq.name,
          category: eq.category,
          manufacturer: eq.manufacturer,
          model: eq.model,
          serialNumber: eq.serialNumber,
          location: eq.location,
          requiresTraining: eq.requiresTraining,
          minimumTrainingLevel: eq.minimumTrainingLevel,
          trainingValidityDays: eq.trainingValidityDays,
        },
        summary: {
          totalCertified: activeCerts.length,
          totalExpired: expiredCerts.length,
          complianceStatus: activeCerts.length > 0 && expiredCerts.length === 0 ? 'OK' : 'MANGLER',
        },
        certifiedUsers,
        lastTraining: lastTrainingSession ? {
          title: lastTrainingSession.title,
          provider: lastTrainingSession.provider?.name || lastTrainingSession.instructorName,
          date: lastTrainingSession.trainingDate,
          participants: lastTrainingSession.certifications?.length || 0,
        } : null,
        safety: {
          riskAssessment: eq.riskAssessment,
          safetyInstructions: eq.safetyInstructions,
          emergencyProcedures: eq.emergencyProcedures,
        },
      };
    });

    // Samlet statistikk
    const totalStats = {
      totalEquipment: report.length,
      compliantEquipment: report.filter(r => r.summary.complianceStatus === 'OK').length,
      nonCompliantEquipment: report.filter(r => r.summary.complianceStatus === 'MANGLER').length,
      totalCertifiedUsers: new Set(
        report.flatMap(r => r.certifiedUsers.map(u => u.email))
      ).size,
      totalActiveCertifications: report.reduce((sum, r) => sum + r.summary.totalCertified, 0),
      totalExpiredCertifications: report.reduce((sum, r) => sum + r.summary.totalExpired, 0),
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      generatedBy: {
        name: `${session.user.firstName} ${session.user.lastName}`,
        email: session.user.email,
      },
      companyInfo: {
        // Dette kan hentes fra settings eller miljøvariabler
        name: process.env.COMPANY_NAME || 'Bedriftsnavn',
        orgNumber: process.env.COMPANY_ORG_NUMBER || '',
      },
      stats: totalStats,
      equipment: report,
      compliance: {
        arbeidsmiljoloven: '§ 4-5 - Opplæring',
        status: totalStats.nonCompliantEquipment === 0 ? 'I ORDEN' : 'AVVIK FUNNET',
        notes: totalStats.nonCompliantEquipment > 0
          ? `${totalStats.nonCompliantEquipment} utstyr mangler tilstrekkelig opplæring`
          : 'All utstyr har gyldige sertifiseringer',
      },
    });
  } catch (error) {
    console.error('Feil ved generering av inspektør-rapport:', error);
    return NextResponse.json(
      { error: 'Kunne ikke generere rapport' },
      { status: 500 }
    );
  }
}

