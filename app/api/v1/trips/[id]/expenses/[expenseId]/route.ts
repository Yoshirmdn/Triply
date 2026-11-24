import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accessWhere, memberSelect } from "@/lib/trip-helpers";
import { expenseInclude, serializeExpense } from "@/lib/expense-helpers";
import { listParticipants } from "@/lib/settlement-helpers";
import { resolveExpenseSplit } from "@/lib/settlement";
import { uuidSchema } from "@/lib/validations/common.schema";
import { expenseUpdateSchema } from "@/lib/validations/expense.schema";
import { parseDateInput } from "@/utils/date";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; expenseId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id, expenseId } = await params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true, userId: true, members: memberSelect(actor.id) },
    });
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const memberRole = trip.members[0]?.role;
    const canEdit = trip.userId === actor.id || (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = expenseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 400, message: "Validation failed!", errors: z.flattenError(parsed.error) },
        { status: 400 },
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, tripId: id },
      select: { id: true, paidById: true, shares: { select: { userId: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const touchesSplit = parsed.data.paidById !== undefined || parsed.data.shareUserIds !== undefined;
    let splitData: { paidById: string | null; shares: { deleteMany: object; create: { userId: string }[] } } | null = null;
    if (touchesSplit) {
      const participants = await listParticipants(id);
      const split = resolveExpenseSplit(
        {
          paidById: parsed.data.paidById !== undefined ? parsed.data.paidById : existing.paidById,
          shareUserIds: parsed.data.shareUserIds ?? existing.shares.map((share) => share.userId),
        },
        participants.map((person) => person.id),
      );
      if (!split.ok) {
        return NextResponse.json({ success: false, status: 422, message: split.message }, { status: 422 });
      }
      splitData = {
        paidById: split.paidById,
        shares: { deleteMany: {}, create: split.shareUserIds.map((userId) => ({ userId })) },
      };
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      include: expenseInclude,
      data: {
        ...(splitData ?? {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
        ...(parsed.data.expenseDate !== undefined ? { expenseDate: parseDateInput(parsed.data.expenseDate) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data updated successfully!",
      data: serializeExpense(expense),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json({ success: false, status: 403, message: "Account is inactive!" }, { status: 403 });
    }
    if (!actor) {
      return NextResponse.json({ success: false, status: 401, message: "Unauthorized!" }, { status: 401 });
    }

    const { id, expenseId } = await params;
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const trip = await prisma.trip.findFirst({
      where: { id, ...accessWhere(actor) },
      select: { id: true, userId: true, members: memberSelect(actor.id) },
    });
    if (!trip) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    const memberRole = trip.members[0]?.role;
    const canEdit = trip.userId === actor.id || (memberRole !== undefined && memberRole !== "VIEWER");
    if (!canEdit) {
      return NextResponse.json({ success: false, status: 403, message: "Forbidden!" }, { status: 403 });
    }

    const result = await prisma.expense.deleteMany({ where: { id: expenseId, tripId: id } });
    if (result.count === 0) {
      return NextResponse.json({ success: false, status: 404, message: "Data not found!" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: 200, message: "Data deleted successfully!", data: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, status: 500, message: "Internal server error!" }, { status: 500 });
  }
}