import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RoiSettingsSchema = z.object({
  resourcePool: z.number(),
  structureCost: z.number(),
  directionCost: z.number(),
  externalCosts: z.number(),
  licenseCosts: z.number(),
  otherCosts: z.number(),
  minMarkup: z.number(),
  allocationMode: z.enum(["daily", "monthly"]),
  productiveDays: z.number(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.roiSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RoiSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.roiSettings.update({
    where: { id: "singleton" },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
