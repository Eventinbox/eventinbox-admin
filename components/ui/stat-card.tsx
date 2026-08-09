import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { Label } from "@/components/ui/typography";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  glow,
  danger,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconType;
  accent?: boolean;
  // success state: cyan border + glow (e.g. delivery rate ≥ 99%)
  glow?: boolean;
  // problem state: red tint (e.g. failures in the period)
  danger?: boolean;
}) {
  const borderColor = glow ? "rgba(0,229,255,0.35)" : danger ? "rgba(220,38,38,0.4)" : "line";
  const boxShadow = glow
    ? "0 0 26px -8px rgba(0,229,255,0.5)"
    : danger
      ? "0 0 26px -10px rgba(220,38,38,0.45)"
      : undefined;
  const bg = danger ? "rgba(220,38,38,0.05)" : "panel";
  const valueColor = danger ? "red.300" : accent || glow ? "brand.solid" : "ink";

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p="5"
      minW="0"
      boxShadow={boxShadow}
      transition="box-shadow 0.3s, border-color 0.3s"
    >
      <Flex align="center" justify="space-between" mb="3">
        <Label>{label}</Label>
        {icon && (
          <Icon
            as={icon}
            boxSize="4"
            color={danger ? "red.400" : accent || glow ? "brand.solid" : "muted"}
          />
        )}
      </Flex>
      <Text
        fontSize={{ base: "3xl", md: "4xl" }}
        fontWeight="bold"
        fontFamily="mono"
        color={valueColor}
        lineHeight="1"
        letterSpacing="-0.03em"
        css={{
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum", "zero", "ss01"',
          ...(glow ? { textShadow: "0 0 18px rgba(0,229,255,0.45)" } : {}),
        }}
      >
        {value}
      </Text>
      {hint && (
        <Text fontSize="xs" color="muted" mt="2.5" fontFamily="mono">
          {hint}
        </Text>
      )}
    </Box>
  );
}
