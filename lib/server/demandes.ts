import { prisma } from "@/lib/prisma";
import { calculate, buildPayload } from "@/lib/engine";
import type { BuilderState, CalculationResult, ExportedPayload } from "@/lib/types";
import type { PackKey } from "@/lib/data";
import type { Demande } from "@prisma/client";
import type { CreateDemandeInput, ReadjustDemandeInput } from "./demande-schema";
import { sanitizeForPublicOffer } from "./public-offer";

export type DemandeStatus = "submitted" | "adjusted" | "accepted" | "rejected";

export function demandeToBuilderState(demande: Demande): BuilderState {
  return {
    client: JSON.parse(demande.client),
    need: JSON.parse(demande.need),
    pricing: JSON.parse(demande.pricing),
    roiAdai: JSON.parse(demande.roiAdai),
    roiClient: JSON.parse(demande.roiClient),
    selectedModules: new Set(JSON.parse(demande.selectedModules) as string[]),
    openDomains: new Set<string>(),
    currentPack: demande.currentPack as PackKey,
  };
}

export function demandeToResult(demande: Demande): CalculationResult {
  return calculate(demandeToBuilderState(demande));
}

export function demandeToPayload(demande: Demande): ExportedPayload {
  const state = demandeToBuilderState(demande);
  return buildPayload(state, calculate(state));
}

export async function createDemande(input: CreateDemandeInput) {
  return prisma.demande.create({
    data: {
      status: "submitted",
      currentPack: input.currentPack,
      selectedModules: JSON.stringify(input.selectedModules),
      client: JSON.stringify(input.client),
      need: JSON.stringify(input.need),
      pricing: JSON.stringify(input.pricing),
      roiAdai: JSON.stringify(input.roiAdai),
      roiClient: JSON.stringify(input.roiClient),
    },
  });
}

export async function listDemandes(params: {
  search?: string;
  status?: DemandeStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  const where = params.status ? { status: params.status } : {};

  const [rows, total] = await Promise.all([
    prisma.demande.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.demande.count({ where }),
  ]);

  const search = params.search?.trim().toLowerCase();
  const filtered = search
    ? rows.filter((r) => {
        const client = JSON.parse(r.client) as { companyName?: string; projectName?: string };
        return (
          client.companyName?.toLowerCase().includes(search) ||
          client.projectName?.toLowerCase().includes(search)
        );
      })
    : rows;

  return {
    items: filtered.map((r) => {
      const client = JSON.parse(r.client) as { companyName?: string; projectName?: string };
      const result = demandeToResult(r);
      return {
        id: r.id,
        companyName: client.companyName || "(sans nom)",
        projectName: client.projectName || "(sans projet)",
        pack: r.currentPack,
        commercialPrice: result.commercialPrice,
        status: r.status,
        createdAt: r.createdAt,
      };
    }),
    total,
    page,
    pageSize,
  };
}

export async function getDemande(id: string) {
  return prisma.demande.findUnique({ where: { id } });
}

export async function readjustDemande(id: string, patch: ReadjustDemandeInput) {
  const existing = await prisma.demande.findUnique({ where: { id } });
  if (!existing) return null;

  const state = demandeToBuilderState(existing);
  const nextState: BuilderState = {
    ...state,
    currentPack: patch.currentPack ?? state.currentPack,
    selectedModules: patch.selectedModules ? new Set(patch.selectedModules) : state.selectedModules,
    pricing: { ...state.pricing, ...patch.pricing },
    roiClient: { ...state.roiClient, ...patch.roiClient },
  };

  return prisma.demande.update({
    where: { id },
    data: {
      status: "adjusted",
      currentPack: nextState.currentPack,
      selectedModules: JSON.stringify(Array.from(nextState.selectedModules)),
      pricing: JSON.stringify(nextState.pricing),
      roiClient: JSON.stringify(nextState.roiClient),
    },
  });
}

export async function setDemandeStatus(id: string, status: DemandeStatus) {
  return prisma.demande.update({ where: { id }, data: { status } });
}

export async function publishDemande(id: string) {
  const existing = await prisma.demande.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.demande.update({
    where: { id },
    data: { status: "accepted", publishedAt: new Date() },
  });
}

export async function getPublishedOfferByToken(token: string) {
  const demande = await prisma.demande.findUnique({ where: { publicToken: token } });
  if (!demande || !demande.publishedAt) return null;

  const payload = demandeToPayload(demande);
  return { ...sanitizeForPublicOffer(payload), published_at: demande.publishedAt };
}
