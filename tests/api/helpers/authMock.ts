import { vi } from "vitest";
import type { Role } from "@prisma/client";

export type MockSessionUser = {
  id: string;
  email: string;
  role: Role;
  name?: string;
};

const mockAuth = vi.hoisted(() =>
  vi.fn<() => Promise<{ user: MockSessionUser } | null>>(),
);

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

export function setMockSession(user: MockSessionUser | null) {
  mockAuth.mockResolvedValue(user ? { user } : null);
}

export const adminSession: MockSessionUser = {
  id: "1",
  email: "admin@lignum.local",
  role: "admin",
  name: "Administrador Lignum",
};

export const vendedorSession: MockSessionUser = {
  id: "2",
  email: "vendedor@lignum.local",
  role: "vendedor",
  name: "Vendedor Lignum",
};

export const financeiroSession: MockSessionUser = {
  id: "3",
  email: "financeiro@lignum.local",
  role: "financeiro",
  name: "Financeiro Lignum",
};

export const producaoSession: MockSessionUser = {
  id: "4",
  email: "producao@lignum.local",
  role: "producao",
  name: "Produção Lignum",
};

export const readOnlySession: MockSessionUser = {
  id: "5",
  email: "readonly@lignum.local",
  role: "read_only",
  name: "Leitura Lignum",
};

/** @deprecated Use vendedorSession */
export const operatorSession: MockSessionUser = vendedorSession;
