// The single status vocabulary for the whole app. Same status -> same color,
// same motion, everywhere. Cyan is deliberately NOT used here — it's reserved
// for LIVE state and primary actions, so status never competes with it.
//
//   delivered  green   steady
//   failed     red     steady
//   pending    amber   slow pulse
//   processing amber   fast pulse
//   retrying   amber   fast pulse   (a pending delivery that has already tried)
//   enabled    green   steady
//   disabled   grey    steady

import type { Delivery } from "./types";

export type Pulse = "none" | "slow" | "fast";

export interface StatusVisual {
  color: string;
  pulse: Pulse;
}

const VISUALS: Record<string, StatusVisual> = {
  delivered: { color: "green.400", pulse: "none" },
  failed: { color: "red.400", pulse: "none" },
  pending: { color: "yellow.400", pulse: "slow" },
  processing: { color: "yellow.400", pulse: "fast" },
  retrying: { color: "yellow.400", pulse: "fast" },
  enabled: { color: "green.400", pulse: "none" },
  active: { color: "green.400", pulse: "none" },
  disabled: { color: "muted", pulse: "none" },
  inactive: { color: "muted", pulse: "none" },
};

export function statusVisual(status?: string | null): StatusVisual {
  return VISUALS[(status ?? "").toLowerCase()] ?? { color: "muted", pulse: "none" };
}

export type StatusPalette = "green" | "red" | "yellow" | "gray";

export function statusPalette(status?: string | null): StatusPalette {
  switch ((status ?? "").toLowerCase()) {
    case "delivered":
    case "enabled":
    case "active":
      return "green";
    case "failed":
      return "red";
    case "pending":
    case "processing":
    case "retrying":
      return "yellow";
    default:
      return "gray";
  }
}

/**
 * A pending delivery that has already burned attempts is "retrying" — a
 * distinct, faster-pulsing state from a fresh pending delivery.
 */
export function effectiveDeliveryStatus(d: Delivery): string {
  if (d.status === "pending" && (d.attempt_count ?? 0) > 0) return "retrying";
  return d.status ?? "pending";
}
