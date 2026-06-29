"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function GlobalSpinner() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden"
      aria-hidden={!active}
    >
      <div
        className="h-full origin-left bg-primary transition-transform duration-300 ease-out"
        style={{
          transform: active ? "scaleX(1)" : "scaleX(0)",
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}
