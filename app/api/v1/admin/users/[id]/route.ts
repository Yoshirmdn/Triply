import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/validations/common.schema";
import { updateUserSchema } from "@/lib/validations/admin.schema";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }
    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    if (id === actor.id) {
      return NextResponse.json(
        { success: false, status: 403, message: "You cannot modify your own account!" },
        { status: 403 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const nextRole = parsed.data.role ?? target.role;
    const nextActive = parsed.data.isActive ?? target.isActive;
    const losesAdmin = target.role === "SUPER_ADMIN" && target.isActive && (nextRole !== "SUPER_ADMIN" || !nextActive);
    if (losesAdmin) {
      const otherAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: id } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { success: false, status: 400, message: "At least one active super admin is required!" },
          { status: 400 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    const changes: string[] = [];
    if (parsed.data.role !== undefined && parsed.data.role !== target.role) changes.push(`role menjadi ${parsed.data.role}`);
    if (parsed.data.isActive !== undefined && parsed.data.isActive !== target.isActive) {
      changes.push(parsed.data.isActive ? "diaktifkan" : "dinonaktifkan");
    }
    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: actor.id,
          action: "USER_UPDATED",
          description: `Mengubah pengguna ${target.email}: ${changes.join(", ")}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}