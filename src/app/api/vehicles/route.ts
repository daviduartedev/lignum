import type { Prisma, VehicleStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { vehicleCreateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "1") {
    const data = await prisma.vehicle.findMany({
      orderBy: { id: "desc" },
      take: 500,
    });
    return ok(data);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status") as VehicleStatus | null;
  const plate = searchParams.get("plate");

  const where: Prisma.VehicleWhereInput = {};
  if (status) {
    where.status = status;
  }
  if (plate) {
    where.plate = { contains: plate, mode: "insensitive" };
  }

  const [total, data] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(staffRoles, async (req: NextRequest) => {
  const text = await req.text();
  let raw: unknown = {};
  if (text.trim()) {
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      return fail("BAD_REQUEST", 400, { message: "Corpo JSON inválido." });
    }
  }
  const parsed = vehicleCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.vehicle.create({
    data: {
      documentId: d.documentId,
      plate: d.plate,
      brand: d.brand,
      model: d.model,
      version: d.version,
      yearManufacture: d.yearManufacture,
      yearModel: d.yearModel,
      mileage: d.mileage,
      color: d.color,
      fuel: d.fuel,
      transmission: d.transmission,
      fipePrice: d.fipePrice,
      purchasePrice: d.purchasePrice,
      estimatedMaintenanceCost: d.estimatedMaintenanceCost,
      sellingPrice: d.sellingPrice,
      minimumSellingPrice: d.minimumSellingPrice,
      status: d.status,
      observations: d.observations,
      mainPhotoUrl: d.mainPhotoUrl || undefined,
      galleryUrls: d.galleryUrls ?? [],
      attachmentUrls: d.attachmentUrls ?? [],
      buyerId: d.buyerId ?? undefined,
      doorsCount: d.doorsCount ?? undefined,
      lastLicensingDate: d.lastLicensingDate ? new Date(d.lastLicensingDate) : undefined,
      purchaseEntryAt: d.purchaseEntryAt ? new Date(d.purchaseEntryAt) : undefined,
      purchaseEntryMileage: d.purchaseEntryMileage ?? undefined,
      purchaseSupplierId: d.purchaseSupplierId ?? undefined,
      purchasePaymentJson: d.purchasePaymentJson ?? undefined,
      renavam: d.renavam,
      chassis: d.chassis.toUpperCase(),
      legalSituation: d.legalSituation,
      categoryKind: d.categoryKind,
      cautelar: d.cautelar,
      speciesCategory: d.speciesCategory,
      registrationCity: d.registrationCity,
      registrationUf: d.registrationUf,
      listingTitle: d.listingTitle,
      officialExtraFields: d.officialExtraFields ?? undefined,
      senatranFieldProvenance: d.senatranFieldProvenance ?? undefined,
    },
  });
  return ok(created, { status: 201 });
});
