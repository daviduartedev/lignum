import React from "react";
import { Svg, Polygon } from "@react-pdf/renderer";

/** Símbolo Lignum para documentos PDF (react-pdf). */
export function LignumPdfMark({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon points="14,10 24,4 24,34 44,34 44,44 14,44" fill="#0D47FF" />
      <Polygon points="24,4 28,6 28,34 24,34" fill="#0A2EA6" />
    </Svg>
  );
}
