export function employeeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function employeeStatusLabel(isActive: boolean): string {
  return isActive ? "Ativo" : "Inativo";
}

export function employeeStatusBadgeClass(isActive: boolean): string {
  return isActive
    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
    : "bg-slate-100 text-slate-600 border border-slate-200";
}
