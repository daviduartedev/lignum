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

export const operatorSession: MockSessionUser = {
  id: "2",
  email: "operador@lignum.local",
  role: "authenticated",
  name: "Operador",
};
