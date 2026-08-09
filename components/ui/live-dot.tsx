import { Box, Flex, Text } from "@chakra-ui/react";

/** Pulsing cyan dot with an expanding ring — signals a live-polling panel. */
export function LiveDot({ live = true, label = "LIVE" }: { live?: boolean; label?: string }) {
  return (
    <Flex align="center" gap="2">
      <Box position="relative" boxSize="2.5">
        {live && (
          <Box
            position="absolute"
            inset="0"
            borderRadius="full"
            bg="brand.solid"
            css={{ animation: "ei-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }}
          />
        )}
        <Box
          position="relative"
          boxSize="2.5"
          borderRadius="full"
          bg={live ? "brand.solid" : "muted"}
          className={live ? "ei-live-dot" : undefined}
          boxShadow={live ? "0 0 8px rgba(0,229,255,0.8)" : undefined}
        />
      </Box>
      <Text
        fontFamily="mono"
        fontSize="0.65rem"
        letterSpacing="0.12em"
        fontWeight="bold"
        color={live ? "brand.solid" : "muted"}
      >
        {live ? label : "PAUSED"}
      </Text>
    </Flex>
  );
}
