/**
 * Mescla autofill apenas em campos vazios (preserva edição manual).
 */
export function mergeAutofillEmptyOnly<T extends Record<string, string>>(
  current: T,
  patch: Partial<T>,
): T {
  const next = { ...current };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key];
    if (value == null || value === "") continue;
    const existing = next[key];
    if (existing != null && String(existing).trim() !== "") continue;
    next[key] = value as T[keyof T];
  }
  return next;
}

export function applyDocumentLookupToClientForm<
  T extends {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    zipCode: string;
    street: string;
    streetNumber: string;
    addressComplement: string;
    neighborhood: string;
    city: string;
    registrationStatus?: string;
  },
>(current: T, lookup: {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  street?: string;
  streetNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  registrationStatus?: string;
}): T {
  return mergeAutofillEmptyOnly(current, {
    fullName: lookup.fullName ?? "",
    email: lookup.email ?? "",
    phone: lookup.phone ?? "",
    address: lookup.address ?? "",
    zipCode: lookup.zipCode ?? "",
    street: lookup.street ?? "",
    streetNumber: lookup.streetNumber ?? "",
    addressComplement: lookup.addressComplement ?? "",
    neighborhood: lookup.neighborhood ?? "",
    city: lookup.city ?? "",
    registrationStatus: lookup.registrationStatus ?? "",
  } as Partial<T>);
}
