import { ZodError } from "zod";
import { fail } from "@/lib/jsonResponse";
import { parsePositiveInt } from "@/lib/parseId";

/** @deprecated use parsePositiveInt from `@/lib/parseId` */
export function parseIdParam(id: string): number | null {
  return parsePositiveInt(id);
}

export function zodErrorResponse(e: ZodError) {
  const flat = e.flatten();
  const details: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat.fieldErrors)) {
    if (v && v.length) details[k] = v;
  }
  if (flat.formErrors.length) {
    details._form = flat.formErrors;
  }
  return fail("VALIDATION_ERROR", 422, { details });
}
