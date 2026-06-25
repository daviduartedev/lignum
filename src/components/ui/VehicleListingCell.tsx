"use client";

import type { ReactNode } from "react";
import type { Vehicle } from "@/types";
import { vehicleDisplayName } from "@/types";
import { VehicleThumbnail } from "@/components/ui/VehicleThumbnail";
import { cn } from "@/components/ui/utils";

type VehicleListingCellProps = {
  vehicle: Vehicle;
  subtitle?: ReactNode;
  className?: string;
  thumbnailClassName?: string;
};

/** Miniatura + nome - padrão de listagens de veículo (referência: `/estoque`). */
export function VehicleListingCell({ vehicle, subtitle, className, thumbnailClassName }: VehicleListingCellProps) {
  const displayName = vehicleDisplayName(vehicle);

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div className={cn("w-11 h-11 rounded-lg overflow-hidden border border-border shrink-0", thumbnailClassName)}>
        <VehicleThumbnail
          vehicle={vehicle}
          alt={displayName}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
        {subtitle ? <div className="text-[10px] text-muted-foreground uppercase font-medium">{subtitle}</div> : null}
      </div>
    </div>
  );
}
