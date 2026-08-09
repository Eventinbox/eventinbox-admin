"use client";

import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useEffect } from "react";
import { LuTriangleAlert } from "react-icons/lu";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for diagnostics; wire to your error tracker here.
    console.error(error);
  }, [error]);

  return (
    <Flex minH="100dvh" align="center" justify="center" bg="canvas" p="6">
      <Stack
        gap="4"
        align="center"
        textAlign="center"
        maxW="420px"
        bg="panel"
        borderWidth="1px"
        borderColor="line"
        borderRadius="xl"
        p="10"
      >
        <Box color="red.400" fontSize="2xl">
          <LuTriangleAlert />
        </Box>
        <Text fontSize="lg" fontWeight="semibold" color="ink">
          Something went wrong
        </Text>
        <Text fontSize="sm" color="muted" fontFamily="mono">
          {error.message || "An unexpected error occurred."}
        </Text>
        <Button colorPalette="brand" color="brand.contrast" onClick={reset}>
          Try again
        </Button>
      </Stack>
    </Flex>
  );
}
