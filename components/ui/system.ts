import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Dark "infra" palette. Cyan #00E5FF accent on near-black surfaces, with a
// monospace family reserved for ids / payloads / timestamps.
const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: { value: "var(--font-geist-sans), system-ui, sans-serif" },
        heading: { value: "var(--font-geist-sans), system-ui, sans-serif" },
        mono: { value: "var(--font-geist-mono), ui-monospace, monospace" },
      },
      colors: {
        // Surfaces — a 3-step elevation system:
        //   well (recessed readout) < canvas (base) < panel (raised)
        well: { value: "#050607" },
        canvas: { value: "#08090A" },
        panel: { value: "#0E0F11" },
        panelHover: { value: "#15171A" },
        line: { value: "#202327" },
        ink: { value: "#E6E8EB" },
        muted: { value: "#878D96" },
        // Cyan brand scale
        brand: {
          50: { value: "#E6FCFF" },
          100: { value: "#CCF9FF" },
          200: { value: "#99F3FF" },
          300: { value: "#66EDFF" },
          400: { value: "#33E9FF" },
          500: { value: "#00E5FF" },
          600: { value: "#00B8CC" },
          700: { value: "#008A99" },
          800: { value: "#005C66" },
          900: { value: "#002E33" },
          950: { value: "#001417" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "#04181C" },
          fg: { value: "{colors.brand.300}" },
          muted: { value: "{colors.brand.900}" },
          subtle: { value: "{colors.brand.950}" },
          emphasized: { value: "{colors.brand.400}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
    keyframes: {
      // Pulsing status dot (pending / live indicators).
      "ei-pulse": {
        "0%, 100%": { opacity: "1", transform: "scale(1)" },
        "50%": { opacity: "0.4", transform: "scale(0.82)" },
      },
      // Expanding ring behind the LIVE dot.
      "ei-ping": {
        "0%": { transform: "scale(1)", opacity: "0.55" },
        "75%, 100%": { transform: "scale(2.4)", opacity: "0" },
      },
      // New live-feed row: slide down out of a cyan glow that fades to nothing.
      "ei-feed-enter": {
        "0%": {
          opacity: "0",
          transform: "translateY(-8px)",
          backgroundColor: "rgba(0,229,255,0.16)",
          boxShadow: "inset 2px 0 0 0 #00E5FF",
        },
        "55%": { opacity: "1", transform: "translateY(0)" },
        "100%": {
          backgroundColor: "transparent",
          boxShadow: "inset 2px 0 0 0 transparent",
        },
      },
      // Skeleton shimmer sweep.
      "ei-shimmer": {
        "0%": { backgroundPosition: "-200% 0" },
        "100%": { backgroundPosition: "200% 0" },
      },
      // Telemetry "blip": a value briefly lights cyan, then settles — used to
      // signal a fresh poll/data update without moving anything.
      "ei-flash": {
        "0%": { color: "#00E5FF" },
        "100%": { color: "var(--chakra-colors-muted)" },
      },
    },
  },
  globalCss: {
    "html, body": {
      backgroundColor: "#08090A",
      color: "#E6E8EB",
      colorScheme: "dark",
    },
    "*::selection": {
      backgroundColor: "rgba(0, 229, 255, 0.25)",
    },
    "::-webkit-scrollbar": { width: "10px", height: "10px" },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "#202327",
      borderRadius: "8px",
    },

    // ---- Typographic primitives --------------------------------------------
    // All data (ids, timestamps, counts, status, urls, secrets) renders mono
    // with tabular figures + slashed zero so columns align like a readout.
    ".ei-mono": {
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontVariantNumeric: "tabular-nums",
      fontFeatureSettings: '"tnum", "zero", "ss01"',
    },
    // Instrument label: tiny, uppercase, letter-spaced, muted.
    ".ei-label": {
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "0.625rem",
      lineHeight: "1.1",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--chakra-colors-muted)",
    },

    // Recessed "well" for code / payload / secret readouts — darker than the
    // canvas with a soft inner shadow so it reads as inset into the panel.
    ".ei-well": {
      backgroundColor: "var(--chakra-colors-well)",
      borderWidth: "1px",
      borderColor: "var(--chakra-colors-line)",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.2)",
    },

    // ---- Micro-motion helper classes (keyframes live in theme.keyframes) ----
    ".ei-live-dot": {
      animation: "ei-pulse 1.6s ease-in-out infinite",
    },
    // Faster pulse for actively-working states (processing / retrying).
    ".ei-live-dot-fast": {
      animation: "ei-pulse 0.85s ease-in-out infinite",
    },
    ".ei-shimmer": {
      background:
        "linear-gradient(90deg, #131518 25%, #1c1f24 37%, #131518 63%)",
      backgroundSize: "400% 100%",
      animation: "ei-shimmer 1.4s ease-in-out infinite",
    },
    // Faint cyan glow on panels that contain live-updating data.
    ".ei-live-panel": {
      boxShadow:
        "0 0 0 1px rgba(0,229,255,0.10), 0 0 24px -8px rgba(0,229,255,0.30)",
      borderColor: "rgba(0,229,255,0.22)",
    },
    // NOTE: the prefers-reduced-motion reset lives in app/globals.css (a
    // universal selector inside an @media block isn't expressible in Chakra's
    // typed globalCss).
  },
});

export const system = createSystem(defaultConfig, config);
