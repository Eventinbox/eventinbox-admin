import { Text, type TextProps } from "@chakra-ui/react";

/**
 * Instrument label: tiny, uppercase, letter-spaced, muted mono — the small
 * captions on a control panel. Use for field labels and column captions.
 */
export function Label(props: TextProps) {
  return (
    <Text
      as="span"
      fontFamily="mono"
      fontSize="0.625rem"
      lineHeight="1.1"
      letterSpacing="0.1em"
      textTransform="uppercase"
      color="muted"
      {...props}
    />
  );
}

/**
 * Monospace data value with tabular figures + slashed zero, so ids/timestamps/
 * counts line up. Use for every piece of machine data.
 */
export function Mono(props: TextProps) {
  return (
    <Text
      as="span"
      fontFamily="mono"
      css={{ fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum", "zero", "ss01"' }}
      {...props}
    />
  );
}
