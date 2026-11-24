import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signOut } from "@/lib/auth";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { loadAccount } from "@/lib/account-helpers";
import { deleteAccountSchema, updateAccountSchema } from "@/lib/validations/account.schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const account = await loadAccount(actor.id);
    if (!account) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: 200, message: "Data fetched successfully!", data: account });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const parsed = updateAccountSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    await prisma.user.update({ where: { id: actor.id }, data: parsed.data });

    const account = await loadAccount(actor.id);
    return NextResponse.json({ success: true, status: 200, message: "Data updated successfully!", data: account });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    if (actor.role === "SUPER_ADMIN") {
      const otherAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: actor.id } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { success: false, status: 422, message: "Super admin terakhir tidak bisa dihapus" },
          { status: 422 },
        );
      }
    }

    await prisma.$transaction([
      prisma.activityLog.create({
        data: { userId: null, action: "USER_DELETED", description: `Akun dihapus oleh pemiliknya: ${actor.email}` },
      }),
      prisma.user.delete({ where: { id: actor.id } }),
    ]);

    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error(error);
    }

    return NextResponse.json({ success: true, status: 200, message: "Data deleted successfully!", data: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}