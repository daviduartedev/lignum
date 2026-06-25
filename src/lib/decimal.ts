import { Prisma } from "@prisma/client";
import { z } from "zod";

/** Zod helper para valores monetários → Prisma.Decimal */
export const zDecimal = z.union([z.number(), z.string()]).transform((v) => new Prisma.Decimal(v));
