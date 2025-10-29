// API for å hente opplæringskjede for utstyr
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent opplæringskjede (hvem trente hvem)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Hent alle aktive sertifiseringer for dette utstyret
    const certifications = await prisma.userEquipmentCertification.findMany({
      where: {
        equipmentId: id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        training: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        certificationDate: 'asc',
      },
    });

    // Bygg opplæringstrappen
    const trainingChain: any[] = [];

    // Finn leverandøropplæringer (SUPPLIER nivå)
    const supplierTraining = certifications.filter(
      cert => cert.certificationLevel === 'SUPPLIER'
    );

    supplierTraining.forEach(cert => {
      const node = {
        id: cert.id,
        user: cert.user,
        level: cert.certificationLevel,
        certifiedBy: cert.certifiedBy,
        certificationDate: cert.certificationDate,
        expiresAt: cert.expiresAt,
        training: cert.training,
        source: 'LEVERANDØR',
        trainedUsers: [] as any[],
      };

      // Finn alle som denne personen har trent (TRAINER eller lavere nivå)
      const trainedByThisUser = certifications.filter(
        c => c.certifiedByUserId === cert.userId && c.id !== cert.id
      );

      node.trainedUsers = trainedByThisUser.map(trainedCert => ({
        id: trainedCert.id,
        user: trainedCert.user,
        level: trainedCert.certificationLevel,
        certificationDate: trainedCert.certificationDate,
        expiresAt: trainedCert.expiresAt,
        // Rekursivt finn hvem denne personen har trent
        trainedUsers: certifications
          .filter(c => c.certifiedByUserId === trainedCert.userId)
          .map(c => ({
            id: c.id,
            user: c.user,
            level: c.certificationLevel,
            certificationDate: c.certificationDate,
            expiresAt: c.expiresAt,
          })),
      }));

      trainingChain.push(node);
    });

    // Finn de som ikke er i kjeden (sertifisert eksternt uten SUPPLIER)
    const inChain = new Set<string>();
    const addToSet = (nodes: any[]) => {
      nodes.forEach(node => {
        inChain.add(node.id);
        if (node.trainedUsers) {
          addToSet(node.trainedUsers);
        }
      });
    };
    addToSet(trainingChain);

    const orphanedCertifications = certifications.filter(
      cert => !inChain.has(cert.id) && cert.certificationLevel !== 'SUPPLIER'
    );

    // Statistikk
    const stats = {
      total: certifications.length,
      active: certifications.filter(c => {
        if (!c.expiresAt) return true;
        return c.expiresAt > new Date();
      }).length,
      expired: certifications.filter(c => {
        if (!c.expiresAt) return false;
        return c.expiresAt <= new Date();
      }).length,
      byLevel: {
        SUPPLIER: certifications.filter(c => c.certificationLevel === 'SUPPLIER').length,
        TRAINER: certifications.filter(c => c.certificationLevel === 'TRAINER').length,
        ADVANCED: certifications.filter(c => c.certificationLevel === 'ADVANCED').length,
        INTERMEDIATE: certifications.filter(c => c.certificationLevel === 'INTERMEDIATE').length,
        BASIC: certifications.filter(c => c.certificationLevel === 'BASIC').length,
      },
    };

    return NextResponse.json({
      trainingChain,
      orphanedCertifications,
      stats,
      equipment: await prisma.equipment.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          category: true,
          manufacturer: true,
          model: true,
        },
      }),
    });
  } catch (error) {
    console.error('Feil ved henting av opplæringskjede:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente opplæringskjede' },
      { status: 500 }
    );
  }
}

