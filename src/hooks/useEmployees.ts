"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createEmployee,
  deleteEmployee,
  fetchAllEmployees,
  fetchEmployee,
  fetchEmployeeProductivity,
  fetchEmployeesPage,
  updateEmployee,
} from "@/services/internal/employees";

export const EMPLOYEES_QUERY_KEY = ["employees"] as const;

export function useEmployees(opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, "all", opts?.activeOnly ? "active" : "all"],
    queryFn: () => fetchAllEmployees(opts?.activeOnly),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useEmployeesPage(
  page: number,
  opts?: { q?: string; activeOnly?: boolean; inactiveOnly?: boolean; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? 20;
  const q = opts?.q ?? "";
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, "page", page, pageSize, q, opts?.activeOnly ?? false, opts?.inactiveOnly ?? false],
    queryFn: () =>
      fetchEmployeesPage(page, {
        pageSize,
        q: q || undefined,
        activeOnly: opts?.activeOnly,
        inactiveOnly: opts?.inactiveOnly,
      }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useEmployee(routeId: string | undefined) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, "detail", routeId],
    queryFn: () => fetchEmployee(routeId!),
    enabled: !!routeId,
    retry: 1,
  });
}

export function useEmployeeProductivity(routeId: string | undefined) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, "productivity", routeId],
    queryFn: () => fetchEmployeeProductivity(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createEmployee(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      toast.success("Funcionário cadastrado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateEmployee(routeId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      toast.success("Funcionário atualizado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteEmployee(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      toast.success("Funcionário removido ou desativado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
