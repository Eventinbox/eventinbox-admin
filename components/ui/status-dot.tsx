import { Box } from "@chakra-ui/react";
import { statusVisual } from "@/lib/status";

/**
 * The canonical status dot. Color + pulse come from the shared status
 * vocabulary, so the same status looks (and moves) the same everywhere.
 */
export function StatusDot({
  status,
  size = "1.5",
}: {
  status?: string | null;
  size?: string;
}) {
  const { color, pulse } = statusVisual(status);
  const className =
    pulse === "slow" ? "ei-live-dot" : pulse === "fast" ? "ei-live-dot-fast" : undefined;
  return (
    <Box
      boxSize={size}
      borderRadius="full"
      bg={color}
      flexShrink="0"
      className={className}
    />
  );
}
