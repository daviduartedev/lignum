"use client";

import { GlobalSpinner } from "@/components/GlobalSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { Slide, ToastContainer } from "react-toastify";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
          <GlobalSpinner />
          {children}
        </div>
        <ToastContainer
          position="top-right"
          autoClose={4800}
          newestOnTop
          limit={5}
          pauseOnFocusLoss
          pauseOnHover
          draggable
          closeOnClick
          rtl={false}
          theme="light"
          transition={Slide}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
