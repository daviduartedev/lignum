"use client";

import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { Vehicle } from "@/types";
import { vehicleAttrs, vehicleMainPhoto } from "@/types";

type VehicleThumbnailProps = {
  vehicle: Vehicle;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Quando true, busca Unsplash se não houver foto própria. */
  unsplashFallback?: boolean;
};

/**
 * Miniatura do veículo: foto real ou 1 imagem Unsplash pelo título (marca/modelo/versão).
 */
export function VehicleThumbnail({
  vehicle,
  alt,
  className = "",
  imgClassName = "w-full h-full object-cover",
  unsplashFallback = true,
}: VehicleThumbnailProps) {
  const main = vehicleMainPhoto(vehicle);
  const a = vehicleAttrs(vehicle);
  const [unsplashUrl, setUnsplashUrl] = useState<string | undefined>();
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (main || !unsplashFallback) {
      setUnsplashUrl(undefined);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ brand: a.brand, model: a.model });
    if (a.version) params.set("version", a.version);

    apiFetch<{ url: string }>(`/api/vehicles/unsplash-photo?${params}`)
      .then((data) => {
        if (!cancelled) setUnsplashUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setUnsplashUrl(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [main, unsplashFallback, vehicle.id, a.brand, a.model, a.version]);

  const src = main ?? unsplashUrl;

  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Car className="w-5 h-5 text-gray-400" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={imgClassName}
      onError={() => setBroken(true)}
    />
  );
}
