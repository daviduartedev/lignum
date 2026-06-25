"use client";

import { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { mergeVehiclePhotoUrls } from "@/lib/vehicleImages";
import type { StrapiMedia, Vehicle } from "@/types";
import { vehicleAttrs } from "@/types";

function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : url;
}

type Props = {
  vehicle: Vehicle;
};

export function DetalheVeiculoGallery({ vehicle }: Props) {
  const a = vehicleAttrs(vehicle);
  const mainPhotoRaw = a.main_photo as { data?: StrapiMedia | null; url?: string } | undefined;
  const mainPhotoUrl = mediaUrl(mainPhotoRaw?.data?.url ?? mainPhotoRaw?.url);
  const galleryData = a.gallery?.data;
  const galleryUrls = Array.isArray(galleryData)
    ? galleryData.map((m: StrapiMedia) => mediaUrl(m.url)).filter(Boolean)
    : [];

  const [brokenPhotoUrls, setBrokenPhotoUrls] = useState<Set<string>>(() => new Set());
  const [unsplashHero, setUnsplashHero] = useState<string | undefined>();

  const markPhotoBroken = useCallback((url: string) => {
    setBrokenPhotoUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const allPhotoUrls = mergeVehiclePhotoUrls(mainPhotoUrl, galleryUrls as string[]).filter(
    (u) => !brokenPhotoUrls.has(u),
  );

  useEffect(() => {
    if (allPhotoUrls.length > 0) {
      setUnsplashHero(undefined);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ brand: a.brand, model: a.model });
    if (a.version) params.set("version", a.version);
    apiFetch<{ url: string }>(`/api/vehicles/unsplash-photo?${params}`)
      .then((data) => {
        if (!cancelled) setUnsplashHero(data.url);
      })
      .catch(() => {
        if (!cancelled) setUnsplashHero(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [allPhotoUrls.length, a.brand, a.model, a.version]);

  const heroPhotoUrl = allPhotoUrls[0] ?? unsplashHero;
  const sidePhotoUrls = allPhotoUrls.length > 0 ? allPhotoUrls.slice(1, 4) : [];
  const extraPhotoCount = allPhotoUrls.length > 4 ? allPhotoUrls.length - 4 : 0;

  return (
    <div
      className={`grid grid-cols-1 gap-2 p-2 ${sidePhotoUrls.length > 0 || extraPhotoCount > 0 ? "md:grid-cols-4" : ""}`}
    >
      <div
        className={`aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 ${sidePhotoUrls.length > 0 || extraPhotoCount > 0 ? "md:col-span-3" : ""}`}
      >
        {heroPhotoUrl ? (
          <img
            src={heroPhotoUrl}
            className="w-full h-full object-cover"
            alt="Principal"
            onError={() => markPhotoBroken(heroPhotoUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}
      </div>
      {(sidePhotoUrls.length > 0 || extraPhotoCount > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {sidePhotoUrls.map((url, i) => (
            <div key={url} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-white">
              <img
                src={url}
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                alt={`Foto ${i + 2}`}
                onError={() => markPhotoBroken(url)}
              />
            </div>
          ))}
          {extraPhotoCount > 0 && (
            <div className="aspect-square rounded-xl bg-gray-900 border border-white flex flex-col items-center justify-center text-white cursor-pointer hover:bg-gray-800">
              <ImageIcon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">+{extraPhotoCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
