"use client";

import { FeatureComingSoon } from "@/components/FeatureComingSoon";
import { Painel } from "@/components/pages/Painel";

export function MainShell({ slug }: { slug?: string[] }) {
  if (!slug?.length) return <Painel />;
  return <FeatureComingSoon title={`/${slug.join("/")}`} />;
}
