import { Badge, Flex, Text } from "@chakra-ui/react";
import { LuShieldCheck } from "react-icons/lu";

/** EventInbox mark + an "ADMIN" tag — the admin console's wordmark. */
export function AdminLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "7" : "8";
  return (
    <Flex align="center" gap="2.5">
      <Flex
        align="center"
        justify="center"
        boxSize={box}
        borderRadius="md"
        bg="brand.solid"
        color="brand.contrast"
        fontSize={size === "sm" ? "sm" : "md"}
        flexShrink="0"
        boxShadow="0 0 18px rgba(0,229,255,0.35)"
      >
        <LuShieldCheck />
      </Flex>
      <Flex align="center" gap="2">
        <Text
          fontWeight="bold"
          fontSize={size === "sm" ? "md" : "lg"}
          letterSpacing="-0.01em"
          color="ink"
        >
          Event<Text as="span" color="brand.solid">Inbox</Text>
        </Text>
        <Badge
          colorPalette="brand"
          variant="surface"
          fontFamily="mono"
          fontSize="0.55rem"
          letterSpacing="0.12em"
          textTransform="uppercase"
        >
          Admin
        </Badge>
      </Flex>
    </Flex>
  );
}
