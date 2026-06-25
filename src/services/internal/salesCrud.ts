import { apiFetch } from "@/lib/apiClient";
import type { PaymentMethod } from "@/types";

export type PromissoryPlanPayload = {
  totalInstallments: number;
  installmentAmount: unknown;
  firstDueDate: string;
  intervalMonths: number;
};

export type CreateSalePayload = {
  saleDate: string;
  finalPrice: unknown;
  paymentMethod?: PaymentMethod;
  financingBank?: string;
  notes?: string;
  vehicleId: number;
  clientId: number;
  sellerUserId?: number;
  sellerName?: string;
  promissoryPlan?: PromissoryPlanPayload;
};

export async function createSaleAndMarkVehicleSold(body: CreateSalePayload, _vehicleRouteId: string): Promise<void> {
  await apiFetch<unknown>("/api/sales", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
