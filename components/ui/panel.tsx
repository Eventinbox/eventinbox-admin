import { Box, type BoxProps, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

/** A bordered near-black surface used as the base for cards/sections. */
export function Panel(props: BoxProps) {
  return (
    <Box
      bg="panel"
      borderWidth="1px"
      borderColor="line"
      borderRadius="xl"
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap="4"
      px="5"
      py="4"
      borderBottomWidth="1px"
      borderColor="line"
    >
      <Box>
        <Heading size="sm" color="ink">
          {title}
        </Heading>
        {description && (
          <Text fontSize="sm" color="muted" mt="0.5">
            {description}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
  );
}
