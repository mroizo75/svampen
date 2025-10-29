// API for enkelt utstyr
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Hent ett utstyr
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
    const equipment = await prisma.equipment.findUnique({
      where: { id },
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
          orderBy: {
            certificationDate: "desc",
          },
        },
        maintenanceLogs: {
          orderBy: {
            performedDate: "desc",
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Utstyr ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Feil ved henting av utstyr:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente utstyr" },
      { status: 500 }
    );
  }
}

// PATCH - Oppdater utstyr
export async function PATCH(
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
    const data = await request.json();

    const updateData: any = {};

    // Kun oppdater feltene som er med
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    if (data.warrantyExpiresAt !== undefined) {
      updateData.warrantyExpiresAt = data.warrantyExpiresAt ? new Date(data.warrantyExpiresAt) : null;
    }
    if (data.requiresTraining !== undefined) updateData.requiresTraining = data.requiresTraining;
    if (data.trainingValidityDays !== undefined) updateData.trainingValidityDays = data.trainingValidityDays;
    if (data.minimumTrainingLevel !== undefined) updateData.minimumTrainingLevel = data.minimumTrainingLevel;
    if (data.riskAssessment !== undefined) updateData.riskAssessment = data.riskAssessment;
    if (data.safetyInstructions !== undefined) updateData.safetyInstructions = data.safetyInstructions;
    if (data.emergencyProcedures !== undefined) updateData.emergencyProcedures = data.emergencyProcedures;
    if (data.documents !== undefined) updateData.documents = data.documents;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.requiresInspection !== undefined) updateData.requiresInspection = data.requiresInspection;
    if (data.nextInspectionDate !== undefined) {
      updateData.nextInspectionDate = data.nextInspectionDate ? new Date(data.nextInspectionDate) : null;
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Feil ved oppdatering av utstyr:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere utstyr" },
      { status: 500 }
    );
  }
}

// DELETE - Slett utstyr
export async function DELETE(
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
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Utstyr slettet" });
  } catch (error) {
    console.error("Feil ved sletting av utstyr:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette utstyr" },
      { status: 500 }
    );
  }
}

