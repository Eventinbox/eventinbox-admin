import { Flex, Text } from "@chakra-ui/react";
import { LuInbox } from "react-icons/lu";

export function Logo({ showText = true, size = "md" }: { showText?: boolean; size?: "sm" | "md" }) {
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
        <LuInbox />
      </Flex>
      {showText && (
        <Text fontWeight="bold" fontSize={size === "sm" ? "md" : "lg"} letterSpacing="-0.01em" color="ink">
          Event<Text as="span" color="brand.solid">Inbox</Text>
        </Text>
      )}
    </Flex>
  );
}
