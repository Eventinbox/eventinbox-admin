import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function PageHeader({
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
      align={{ base: "flex-start", sm: "center" }}
      justify="space-between"
      direction={{ base: "column", sm: "row" }}
      gap="4"
      mb="6"
    >
      <Box>
        <Heading size="xl" color="ink" letterSpacing="-0.02em">
          {title}
        </Heading>
        {description && (
          <Text color="muted" mt="1" fontSize="sm">
            {description}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
  );
}
