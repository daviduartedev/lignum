"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_SUGGESTED_VEHICLE_COLORS, filterVehicleColors, VEHICLE_COLOR_GROUPS } from "@/lib/vehicleColors";
import { cn } from "@/components/ui/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

export function VehicleColorCombobox({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQ(value);
  }, [value]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const suggestions = useMemo(() => {
    const query = q.trim() || value;
    return filterVehicleColors(query).slice(0, 60);
  }, [q, value]);

  const pick = (c: string) => {
    onChange(c);
    setQ(c);
    setOpen(false);
  };

  return (
    <div className="space-y-2" ref={wrapRef}>
      <Label htmlFor={id}>Cor</Label>
      <div className="relative">
        <Input
          id={id}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            onChange(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Digite, cole ou escolha uma sugestão…"
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul
            className={cn(
              "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-background shadow-md",
            )}
            role="listbox"
          >
            {suggestions.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Lista de sugestões por grupo ({ALL_SUGGESTED_VEHICLE_COLORS.length} cores)</summary>
        <div className="mt-2 space-y-2 pl-2 border-l">
          {VEHICLE_COLOR_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="font-medium text-foreground/80">{g.label}</p>
              <p className="leading-relaxed">{g.colors.join(" · ")}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
