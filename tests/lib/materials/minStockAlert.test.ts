import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, findManyMock, findFirstMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    material: { findUnique: findUniqueMock },
    user: { findMany: findManyMock },
    userNotification: { findFirst: findFirstMock, create: createMock },
  },
}));

import { dispatchMinStockAlerts, materialAlertLink } from "@/lib/materials/minStockAlert";

describe("dispatchMinStockAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não cria alerta quando material está acima do mínimo", async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      sku: "EST-PER",
      name: "Perfis",
      currentStock: 100,
      minStock: 50,
    });

    const created = await dispatchMinStockAlerts(1);
    expect(created).toBe(0);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("cria notificação idempotente para admin e produção", async () => {
    findUniqueMock.mockResolvedValue({
      id: 2,
      sku: "TMP-PLN",
      name: "Tampa plana",
      currentStock: 1,
      minStock: 2,
    });
    findManyMock.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 99 });

    const created = await dispatchMinStockAlerts(2);
    expect(created).toBe(2);
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock.mock.calls[0][0].data.link).toBe(materialAlertLink(2));
  });

  it("não duplica notificação não lida existente", async () => {
    findUniqueMock.mockResolvedValue({
      id: 3,
      sku: "CON-PAR",
      name: "Parafusos",
      currentStock: 0,
      minStock: 5,
    });
    findManyMock.mockResolvedValue([{ id: 10 }]);
    findFirstMock.mockResolvedValue({ id: 50 });

    const created = await dispatchMinStockAlerts(3);
    expect(created).toBe(0);
    expect(createMock).not.toHaveBeenCalled();
  });
});
