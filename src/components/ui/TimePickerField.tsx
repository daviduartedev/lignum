"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/ui/utils";

type TimePickerFieldProps = Omit<ComponentProps<typeof Input>, "type" | "onChange"> & {
  label?: string;
  onChange: (value: string) => void;
  containerClassName?: string;
};

/** Campo de hora canónico do ERP - label padrão «Hora». */
export function TimePickerField({
  id,
  label = "Hora",
  value,
  onChange,
  className,
  containerClassName,
  required,
  ...props
}: TimePickerFieldProps) {
  return (
    <div className={cn("space-y-1", containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        required={required}
        className={className}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}
