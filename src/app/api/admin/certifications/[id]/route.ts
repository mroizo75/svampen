// API for enkelt sertifisering
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH - Oppdater sertifisering (f.eks. tilbakekall)
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

    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.certificateNumber !== undefined) updateData.certificateNumber = data.certificateNumber;
    if (data.certificateDocument !== undefined) updateData.certificateDocument = data.certificateDocument;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Tilbakekalling
    if (data.revoke) {
      updateData.isActive = false;
      updateData.revokedAt = new Date();
      updateData.revokedBy = `${session.user.firstName} ${session.user.lastName}`;
      updateData.revokedReason = data.revokedReason;
    }

    const certification = await prisma.userEquipmentCertification.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(certification);
  } catch (error) {
    console.error("Feil ved oppdatering av sertifisering:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere sertifisering" },
      { status: 500 }
    );
  }
}

// DELETE - Slett sertifisering
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
    await prisma.userEquipmentCertification.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sertifisering slettet" });
  } catch (error) {
    console.error("Feil ved sletting av sertifisering:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette sertifisering" },
      { status: 500 }
    );
  }
}

