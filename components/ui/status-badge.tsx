import { Badge } from "@chakra-ui/react";
import { StatusDot } from "./status-dot";
import { statusPalette } from "@/lib/status";

export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge
      colorPalette={statusPalette(status)}
      variant="subtle"
      fontFamily="mono"
      fontSize="0.7rem"
      textTransform="lowercase"
      letterSpacing="0.02em"
      gap="1.5"
    >
      <StatusDot status={status} />
      {status ?? "unknown"}
    </Badge>
  );
}
