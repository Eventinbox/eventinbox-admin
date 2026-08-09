"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { system } from "./system";
import { Toaster } from "./toaster";

// App is dark-only: force the `dark` class so Chakra's `_dark` conditions and
// our near-black surfaces always apply. suppressHydrationWarning lives on <html>.
export function Provider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      disableTransitionOnChange
    >
      <ChakraProvider value={system}>
        {children}
        <Toaster />
      </ChakraProvider>
    </ThemeProvider>
  );
}
