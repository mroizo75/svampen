// API for opplæringsøkter
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent alle opplæringsøkter
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
    const isCompleted = searchParams.get("isCompleted");

    const where: any = {};

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    if (isCompleted !== null) {
      where.isCompleted = isCompleted === "true";
    }

    const trainingSessions = await prisma.equipmentTraining.findMany({
      where,
      include: {
        equipment: true,
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
    });

    return NextResponse.json(trainingSessions);
  } catch (error) {
    console.error("Feil ved henting av opplæring:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente opplæring" },
      { status: 500 }
    );
  }
}

// POST - Opprett ny opplæringsøkt
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
    if (!data.equipmentId || !data.title || !data.trainingDate) {
      return NextResponse.json(
        { error: "Utstyr ID, tittel og dato er påkrevd" },
        { status: 400 }
      );
    }

    const training = await prisma.equipmentTraining.create({
      data: {
        equipmentId: data.equipmentId,
        title: data.title,
        description: data.description,
        trainingLevel: data.trainingLevel || "BASIC",
        providerId: data.providerId,
        instructorName: data.instructorName,
        instructorCompany: data.instructorCompany,
        trainingDate: new Date(data.trainingDate),
        duration: data.duration,
        location: data.location,
        validityDays: data.validityDays,
        maxParticipants: data.maxParticipants,
        documents: data.documents || [],
        notes: data.notes,
        isCompleted: data.isCompleted ?? false,
      },
      include: {
        equipment: true,
        provider: true,
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("Feil ved opprettelse av opplæring:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette opplæring" },
      { status: 500 }
    );
  }
}

