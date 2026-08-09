"use client";

import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";

/** A faux terminal window: traffic-light header, mono body, one-click copy. */
export function TerminalBlock({
  command,
  title = "bash",
}: {
  command: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Box
      className="ei-well"
      borderRadius="lg"
      overflow="hidden"
      textAlign="left"
    >
      <Flex
        align="center"
        justify="space-between"
        px="3"
        py="2"
        borderBottomWidth="1px"
        borderColor="line"
        bg="panel"
      >
        <Flex align="center" gap="2">
          <Box boxSize="2.5" borderRadius="full" bg="#ff5f57" />
          <Box boxSize="2.5" borderRadius="full" bg="#febc2e" />
          <Box boxSize="2.5" borderRadius="full" bg="#28c840" />
          <Text fontFamily="mono" fontSize="xs" color="muted" ml="2">
            {title}
          </Text>
        </Flex>
        <IconButton
          aria-label="Copy command"
          size="2xs"
          variant="ghost"
          color="muted"
          onClick={copy}
          _hover={{ color: "brand.solid", bg: "panelHover" }}
        >
          {copied ? <LuCheck /> : <LuCopy />}
        </IconButton>
      </Flex>
      <Box
        as="pre"
        px="4"
        py="3.5"
        fontFamily="mono"
        fontSize="xs"
        lineHeight="1.7"
        color="ink"
        overflowX="auto"
        whiteSpace="pre"
      >
        {command}
      </Box>
    </Box>
  );
}
