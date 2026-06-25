"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/ui/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function formatDisplayPtBr(ymd: string): string {
  const d = parseYmd(ymd);
  return d ? d.toLocaleDateString("pt-BR") : "";
}

type DatePickerFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  required?: boolean;
};

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  placeholder = "Selecionar data",
  disabled,
  className,
  containerClassName,
  required,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (parseYmd(value) ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parseYmd(value) ?? new Date()).getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseYmd(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const todayYmd = useMemo(() => toYmdLocal(new Date()), []);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: { ymd: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(viewYear, viewMonth, -startOffset + i + 1);
      result.push({ ymd: toYmdLocal(d), day: d.getDate(), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      result.push({ ymd: toYmdLocal(d), day, inMonth: true });
    }
    while (result.length % 7 !== 0) {
      const last = result[result.length - 1];
      const d = parseYmd(last.ymd)!;
      d.setDate(d.getDate() + 1);
      result.push({ ymd: toYmdLocal(d), day: d.getDate(), inMonth: false });
    }
    return result;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pick = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-1", containerClassName)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive ml-0.5">*</span> : null}
        </Label>
      ) : null}
      <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        id={id}
        variant="outline"
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal h-10 px-3",
          !value && "text-muted-foreground",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <Calendar className="mr-2 h-4 w-4 shrink-0 text-[#22C55E]" />
        {value ? formatDisplayPtBr(value) : placeholder}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Calendário"
          className="absolute z-50 mt-1 w-[280px] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[#111827]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-medium text-[#6B7280] py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell) => {
              const selected = value === cell.ymd;
              const isToday = todayYmd === cell.ymd;
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  onClick={() => pick(cell.ymd)}
                  className={cn(
                    "h-8 w-full rounded-md text-sm transition-colors",
                    !cell.inMonth && "text-[#9CA3AF]",
                    cell.inMonth && "text-[#111827]",
                    selected && "bg-[#22C55E] text-white hover:bg-[#16A34A]",
                    !selected && isToday && "ring-1 ring-[#22C55E]",
                    !selected && "hover:bg-[#F3F4F6]",
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between gap-2 border-t border-[#E5E7EB] pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => pick(todayYmd)}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
