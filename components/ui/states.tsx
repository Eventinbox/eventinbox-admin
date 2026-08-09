"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuCircleAlert, LuInbox } from "react-icons/lu";
import { TerminalBlock } from "@/components/ui/terminal-block";

/** A single shimmering placeholder block (sweeping cyan-grey gradient). */
function Shimmer({ height, ...rest }: { height: string } & Record<string, unknown>) {
  return <Box className="ei-shimmer" height={height} borderRadius="md" {...rest} />;
}

/** Stack of shimmer rows for list/table loading. */
export function LoadingRows({ rows = 5, height = "52px" }: { rows?: number; height?: string }) {
  return (
    <Stack gap="2">
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} height={height} />
      ))}
    </Stack>
  );
}

export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <Flex gap="4" wrap="wrap">
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} height="96px" flex="1" minW="200px" borderRadius="lg" />
      ))}
    </Flex>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="red.900"
      bg="rgba(220,38,38,0.06)"
      borderRadius="lg"
      p="6"
      textAlign="center"
    >
      <Icon as={LuCircleAlert} boxSize="6" color="red.400" mb="2" />
      <Text fontWeight="medium" color="ink">
        Couldn&apos;t load this data
      </Text>
      <Text fontSize="sm" color="muted" mt="1" fontFamily="mono">
        {message}
      </Text>
      {onRetry && (
        <Button mt="4" size="sm" variant="outline" colorPalette="brand" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Box>
  );
}

export function EmptyState({
  icon = <LuInbox />,
  title,
  description,
  action,
  command,
  commandTitle = "bash",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  // optional faux-prompt block with a relevant copyable command
  command?: string;
  commandTitle?: string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="line"
      borderRadius="lg"
      p="10"
      textAlign="center"
      bg="panel"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="12"
        borderRadius="full"
        bg="panelHover"
        color="brand.solid"
        mx="auto"
        mb="4"
        fontSize="xl"
      >
        {icon}
      </Flex>
      <Text fontSize="lg" fontWeight="semibold" color="ink">
        {title}
      </Text>
      {description && (
        <Text fontSize="sm" color="muted" mt="1" maxW="md" mx="auto">
          {description}
        </Text>
      )}
      {command && (
        <Box maxW="540px" mx="auto" mt="6">
          <TerminalBlock command={command} title={commandTitle} />
        </Box>
      )}
      {action && <Box mt="5">{action}</Box>}
    </Box>
  );
}
