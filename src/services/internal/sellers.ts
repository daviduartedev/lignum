import { apiFetch } from "@/lib/apiClient";

export type Seller = {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "vendedor";
};

export type CreateSellerPayload = {
  name: string;
  email: string;
  password: string;
};

export async function fetchSellers(): Promise<Seller[]> {
  return apiFetch<Seller[]>("/api/sellers");
}

export async function createSeller(body: CreateSellerPayload): Promise<Seller> {
  return apiFetch<Seller>("/api/sellers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
