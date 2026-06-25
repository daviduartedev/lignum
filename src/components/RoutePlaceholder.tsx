import { FeatureComingSoon } from "@/components/FeatureComingSoon";

/** Rotas do Tempo 1 ainda não migradas, substituir pelo componente de página real. */
export function RoutePlaceholder({ path }: { path: string }) {
  return <FeatureComingSoon title={path} />;
}
