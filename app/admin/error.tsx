"use client";

import { Box } from "@chakra-ui/react";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

// Error boundary for every page under /admin. Renders inside the admin shell
// (the layout sits above this), so it stays framed by the sidebar.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box maxW="560px" mx="auto" mt="10">
      <ErrorState
        message={error.message || "An unexpected error occurred on this page."}
        onRetry={reset}
      />
    </Box>
  );
}
