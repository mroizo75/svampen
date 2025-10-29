// API for opplæringsleverandører
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent alle leverandører
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
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const providers = await prisma.trainingProvider.findMany({
      where,
      include: {
        trainingSessions: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Feil ved henting av leverandører:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente leverandører" },
      { status: 500 }
    );
  }
}

// POST - Opprett ny leverandør
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

    if (!data.name) {
      return NextResponse.json(
        { error: "Navn er påkrevd" },
        { status: 400 }
      );
    }

    const provider = await prisma.trainingProvider.create({
      data: {
        name: data.name,
        orgNumber: data.orgNumber,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        accreditations: data.accreditations || [],
        notes: data.notes,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Feil ved opprettelse av leverandør:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette leverandør" },
      { status: 500 }
    );
  }
}

