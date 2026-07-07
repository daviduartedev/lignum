import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToEmployee, type EmployeeDto } from "@/lib/mappers/employee";
import type { EmployeeProductivityDto } from "@/lib/employees/productivity";

export async function fetchEmployeesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; activeOnly?: boolean; inactiveOnly?: boolean },
): Promise<{ items: EmployeeDto[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/employees?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.activeOnly) url += "&active=1";
  if (opts?.inactiveOnly) url += "&active=0";
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToEmployee(r)), meta };
}

export async function fetchAllEmployees(activeOnly?: boolean): Promise<EmployeeDto[]> {
  let url = "/api/employees?all=1";
  if (activeOnly) url += "&active=1";
  const rows = await apiFetch<Record<string, unknown>[]>(url);
  return rows.map((r) => mapApiRowToEmployee(r));
}

export async function fetchEmployee(routeId: string): Promise<EmployeeDto> {
  const row = await apiFetch<Record<string, unknown>>(`/api/employees/${encodeURIComponent(routeId)}`);
  return mapApiRowToEmployee(row);
}

export async function fetchEmployeeProductivity(routeId: string): Promise<EmployeeProductivityDto> {
  return apiFetch<EmployeeProductivityDto>(
    `/api/employees/${encodeURIComponent(routeId)}/productivity`,
  );
}

export async function createEmployee(body: Record<string, unknown>): Promise<EmployeeDto> {
  const row = await apiFetch<Record<string, unknown>>("/api/employees", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToEmployee(row);
}

export async function updateEmployee(
  routeId: string,
  body: Record<string, unknown>,
): Promise<EmployeeDto> {
  const row = await apiFetch<Record<string, unknown>>(`/api/employees/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToEmployee(row);
}

export async function deleteEmployee(routeId: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/employees/${encodeURIComponent(routeId)}`, {
    method: "DELETE",
  });
}
