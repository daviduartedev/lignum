/**
 * Seed de massa para demos de performance (opcional, fora do fluxo default).
 * Executar manualmente: npx tsx prisma/seedBulk.ts (requer admin existente).
 */
import {
  ContractStatus,
  ContractType,
  FuelType,
  PaymentMethod,
  Prisma,
  PrismaClient,
  PromissoryNoteStatus,
  PurchaseEvaluationOutcome,
  PurchaseEvaluationReason,
  ServiceOrderStatus,
  ServiceOrderType,
  TransmissionType,
  VehicleStatus,
  WarrantyStatus,
  WarrantyType,
} from "@prisma/client";

const BULK_MARKER_PLATE = "BULK001";
const VEHICLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.disponivel,
  VehicleStatus.repasse,
  VehicleStatus.reservado,
  VehicleStatus.vendido,
  VehicleStatus.removido,
  VehicleStatus.standby_nao_compra,
];

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function bulkPlate(n: number): string {
  return `BULK${String(n).padStart(3, "0")}`;
}

function clientDocument(n: number): string {
  const d = String(n).padStart(11, "0");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function supplierCnpj(n: number): string {
  const base = String(80000000 + n).padStart(8, "0");
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/0001-${String(n).padStart(2, "0")}`;
}

export async function seedBulkMass(prisma: PrismaClient, adminId: number): Promise<void> {
  const exists = await prisma.vehicle.findFirst({ where: { plate: BULK_MARKER_PLATE } });
  if (exists) {
    console.log("[seed] Massa BULK já presente, skip.");
    return;
  }

  console.log("[seed] Criando massa volumosa (prefixo BULK)…");

  const extraOpEmail = "seed.extra@autocore.local";
  await prisma.user.upsert({
    where: { email: extraOpEmail },
    create: {
      email: extraOpEmail,
      passwordHash: "$2a$12$n0/GAOexdwgbaNv5cDAlh.HyIlSGY3vtjTjDNZGysmD9LnifYcCm6",
      name: "Operador Seed Extra",
      role: "vendedor",
      lgpdConsentVersion: "1.0",
      lgpdConsentAt: new Date(),
    },
    update: { name: "Operador Seed Extra", role: "vendedor" },
  });

  const clientRows: Prisma.ClientCreateManyInput[] = [];
  for (let i = 1; i <= 100; i++) {
    clientRows.push({
      fullName: `Cliente Bulk ${i}`,
      document: clientDocument(90000000000 + i),
      email: `cliente.bulk${i}@example.com`,
      phone: `(11) 9${String(8000 + i).padStart(4, "0")}-${String(1000 + i).slice(-4)}`,
      address: `Rua Seed ${i}, São Paulo/SP`,
      createdAt: daysAgo(i % 90 + 1),
    });
  }
  await prisma.client.createMany({ data: clientRows });

  const clients = await prisma.client.findMany({
    where: { email: { startsWith: "cliente.bulk" } },
    orderBy: { id: "asc" },
    take: 100,
  });

  const supplierRows: Prisma.SupplierCreateManyInput[] = [];
  for (let i = 1; i <= 30; i++) {
    supplierRows.push({
      companyName: `Fornecedor Bulk ${i}`,
      document: supplierCnpj(i),
      phone: `(11) 3${String(1000 + i).padStart(4, "0")}`,
      email: `fornecedor.bulk${i}@example.com`,
      notes: "Fornecedor sintético de seed.",
    });
  }
  await prisma.supplier.createMany({ data: supplierRows });

  const vehicleRows: Prisma.VehicleCreateManyInput[] = [];
  for (let i = 1; i <= 250; i++) {
    let status: VehicleStatus;
    if (i <= 80) {
      status = VehicleStatus.vendido;
    } else {
      status = VEHICLE_STATUSES[(i - 81) % VEHICLE_STATUSES.length]!;
    }
    vehicleRows.push({
      plate: bulkPlate(i),
      brand: i % 3 === 0 ? "Toyota" : i % 3 === 1 ? "Honda" : "Volkswagen",
      model: `Modelo ${i}`,
      version: `Versão ${i}`,
      yearManufacture: 2018 + (i % 7),
      yearModel: 2019 + (i % 7),
      mileage: 5000 + i * 120,
      color: "Prata",
      fuel: FuelType.flex,
      transmission: TransmissionType.automatico,
      fipePrice: new Prisma.Decimal(80000 + i * 500),
      purchasePrice: new Prisma.Decimal(70000 + i * 450),
      sellingPrice: new Prisma.Decimal(85000 + i * 520),
      status,
      renavam: String(10000000000 + i).slice(0, 11),
      chassis: `9BWZZZ377VT${String(i).padStart(6, "0")}`.slice(0, 17),
      createdAt: daysAgo(i % 120 + 1),
    });
  }
  await prisma.vehicle.createMany({ data: vehicleRows });

  const vehicles = await prisma.vehicle.findMany({
    where: { plate: { startsWith: "BULK" } },
    orderBy: { id: "asc" },
  });

  const soldVehicles = vehicles.filter((v) => v.status === VehicleStatus.vendido).slice(0, 80);
  for (let i = 0; i < soldVehicles.length; i++) {
    const vehicle = soldVehicles[i]!;
    const client = clients[i % clients.length]!;
    await prisma.sale.create({
      data: {
        saleDate: daysAgo(10 + (i % 60)),
        finalPrice: vehicle.sellingPrice ?? vehicle.purchasePrice,
        paymentMethod: i % 2 === 0 ? PaymentMethod.pix : PaymentMethod.financiamento,
        financingBank: i % 2 === 0 ? null : "Banco Seed",
        vehicleId: vehicle.id,
        clientId: client.id,
      },
    });
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { buyerId: client.id },
    });
  }

  for (let i = 0; i < 120; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    const client = clients[i % clients.length]!;
    await prisma.contract.create({
      data: {
        contractType: i % 4 === 0 ? ContractType.financiamento : ContractType.compra_venda,
        contractValue: vehicle.sellingPrice ?? vehicle.purchasePrice,
        contractDate: daysAgo(i % 90),
        status: [ContractStatus.rascunho, ContractStatus.pendente_assinatura, ContractStatus.assinado][i % 3]!,
        vehicleId: vehicle.id,
        clientId: client.id,
      },
    });
  }

  for (let i = 0; i < 100; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    await prisma.evaluation.create({
      data: {
        score: 6 + (i % 40) / 10,
        observations: `Avaliação técnica bulk ${i + 1}`,
        vehicleId: vehicle.id,
        createdAt: daysAgo(i % 45),
      },
    });
  }

  for (let i = 0; i < 80; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    const client = clients[i % clients.length]!;
    const outcome =
      i % 5 === 0
        ? PurchaseEvaluationOutcome.pendente
        : i % 7 === 0
          ? PurchaseEvaluationOutcome.nao_comprado
          : PurchaseEvaluationOutcome.comprado;
    await prisma.purchaseEvaluation.create({
      data: {
        outcome,
        reasonCode: outcome === PurchaseEvaluationOutcome.nao_comprado ? PurchaseEvaluationReason.preco : null,
        reasonDetail: outcome === PurchaseEvaluationOutcome.nao_comprado ? "Preço acima da meta." : null,
        vehicleId: vehicle.id,
        clientId: client.id,
        createdAt: daysAgo(i % 30),
      },
    });
  }

  for (let i = 0; i < 120; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    await prisma.serviceOrder.create({
      data: {
        workshopName: `Oficina Bulk ${(i % 12) + 1}`,
        serviceType: ServiceOrderType.manutencao,
        status: [ServiceOrderStatus.aguardando, ServiceOrderStatus.andamento, ServiceOrderStatus.concluida, ServiceOrderStatus.cancelada][
          i % 4
        ]!,
        entryDate: daysAgo(i % 40),
        dueDate: daysAgo(-(i % 14)),
        totalAmount: new Prisma.Decimal(500 + i * 15),
        vehicleId: vehicle.id,
      },
    });
  }

  for (let i = 0; i < 100; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    const client = clients[i % clients.length]!;
    const start = daysAgo(30 + (i % 60));
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    await prisma.warranty.create({
      data: {
        warrantyType: WarrantyType.motor_cambio,
        startDate: start,
        endDate: end,
        coverageValue: new Prisma.Decimal(3000 + i * 50),
        status: [WarrantyStatus.ativa, WarrantyStatus.vencendo, WarrantyStatus.expirada][i % 3]!,
        vehicleId: vehicle.id,
        clientId: client.id,
      },
    });
  }

  const promStatuses: PromissoryNoteStatus[] = [
    PromissoryNoteStatus.aberta,
    PromissoryNoteStatus.paga,
    PromissoryNoteStatus.vencida,
    PromissoryNoteStatus.cancelada,
  ];
  for (let i = 0; i < 300; i++) {
    const vehicle = vehicles[i % vehicles.length]!;
    const client = clients[i % clients.length]!;
    const status = promStatuses[i % 4]!;
    const dueOffset = status === PromissoryNoteStatus.vencida ? -5 : status === PromissoryNoteStatus.paga ? -20 : 15;
    await prisma.promissoryNote.create({
      data: {
        installmentNumber: (i % 12) + 1,
        totalInstallments: 12,
        dueDate: daysAgo(-dueOffset),
        amount: new Prisma.Decimal(800 + (i % 50) * 10),
        status,
        paymentDate: status === PromissoryNoteStatus.paga ? daysAgo(18) : null,
        clientId: client.id,
        vehicleId: vehicle.id,
      },
    });
  }

  for (let i = 0; i < 100; i++) {
    const client = clients[i % clients.length]!;
    await prisma.clientDocument.create({
      data: {
        title: `Documento bulk ${i + 1}`,
        notes: "Anexo sintético.",
        externalUrl: `https://example.com/bulk/doc-${i + 1}.pdf`,
        clientId: client.id,
      },
    });
  }

  for (let i = 0; i < 150; i++) {
    await prisma.userNotification.create({
      data: {
        title: `Notificação bulk ${i + 1}`,
        body: "Mensagem de demonstração gerada pelo seed.",
        read: i % 3 === 0,
        ownerUserId: adminId,
      },
    });
  }

  for (let i = 0; i < 25; i++) {
    await prisma.senatranLookupAudit.create({
      data: {
        userId: adminId,
        plateNormalized: bulkPlate(i + 1).replace(/[^A-Z0-9]/gi, "").toUpperCase(),
        provider: "mock",
        cost: new Prisma.Decimal(0),
        success: true,
        cachedResponse: i % 2 === 0,
        snapshotJson: {
          brand: "Toyota",
          model: "Corolla",
          plate: bulkPlate(i + 1),
          source: "seed-mock",
        },
      },
    });
  }

  console.log(
    `[seed] Massa BULK: ${clients.length} clientes, ${vehicles.length} veículos, 80 vendas, 120 contratos, 300 promissórias, 150 notificações.`,
  );
}
