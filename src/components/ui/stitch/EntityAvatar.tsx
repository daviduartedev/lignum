import { cn } from "@/components/ui/utils";

export function entityInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

const VARIANTS = {
  client: "bg-secondary text-primary",
  supplier: "bg-[#e2e8f8] text-accent",
  neutral: "bg-muted text-muted-foreground",
} as const;

interface EntityAvatarProps {
  name: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
}

export function EntityAvatar({ name, variant = "client", className }: EntityAvatarProps) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0",
        VARIANTS[variant],
        className,
      )}
      aria-hidden
    >
      {entityInitials(name)}
    </div>
  );
}
