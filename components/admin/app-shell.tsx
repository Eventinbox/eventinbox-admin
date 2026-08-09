"use client";

import {
  Box,
  Button,
  Drawer,
  Flex,
  Icon,
  IconButton,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/auth-context";
import { AdminLogo } from "./admin-logo";
import { isActivePath, NAV_ITEMS } from "./nav";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <Stack gap="1">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Flex
            key={item.href}
            asChild
            align="center"
            gap="3"
            px="3"
            py="2"
            borderRadius="md"
            fontSize="sm"
            fontWeight="medium"
            color={active ? "ink" : "muted"}
            bg={active ? "panelHover" : "transparent"}
            borderWidth="1px"
            borderColor={active ? "line" : "transparent"}
            position="relative"
            _hover={{ color: "ink", bg: "panelHover" }}
            transition="background 0.12s, color 0.12s"
          >
            <Link href={item.href} onClick={onNavigate}>
              {active && (
                <Box
                  position="absolute"
                  left="0"
                  top="20%"
                  bottom="20%"
                  w="2px"
                  borderRadius="full"
                  bg="brand.solid"
                />
              )}
              <Icon
                as={item.icon}
                boxSize="4"
                color={active ? "brand.solid" : "muted"}
              />
              {item.label}
            </Link>
          </Flex>
        );
      })}
    </Stack>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  return (
    <Flex direction="column" h="full" p="4" gap="6">
      <Box px="2">
        <AdminLogo />
      </Box>
      <Box flex="1">
        <NavLinks onNavigate={onNavigate} />
      </Box>
      <Box borderTopWidth="1px" borderColor="line" pt="4">
        <Box px="2" mb="3">
          <Text
            fontSize="xs"
            color="muted"
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            Signed in as
          </Text>
          <Text fontSize="sm" color="ink" fontWeight="medium" truncate>
            {user?.full_name || "Administrator"}
          </Text>
          {user?.email && (
            <Text fontSize="xs" color="muted" fontFamily="mono" truncate>
              {user.email}
            </Text>
          )}
        </Box>
        <Button
          variant="ghost"
          size="sm"
          w="full"
          justifyContent="flex-start"
          color="muted"
          _hover={{ color: "ink", bg: "panelHover" }}
          onClick={signOut}
        >
          <LuLogOut /> Sign out
        </Button>
      </Box>
    </Flex>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Flex minH="100dvh" bg="canvas">
      {/* Desktop sidebar */}
      <Box
        as="aside"
        display={{ base: "none", lg: "block" }}
        w="260px"
        flexShrink="0"
        borderRightWidth="1px"
        borderColor="line"
        bg="panel"
        position="sticky"
        top="0"
        h="100dvh"
      >
        <SidebarInner />
      </Box>

      {/* Main column */}
      <Flex direction="column" flex="1" minW="0">
        {/* Mobile top bar */}
        <Flex
          display={{ base: "flex", lg: "none" }}
          align="center"
          justify="space-between"
          px="4"
          h="56px"
          borderBottomWidth="1px"
          borderColor="line"
          bg="panel"
          position="sticky"
          top="0"
          zIndex="10"
        >
          <AdminLogo size="sm" />
          <IconButton
            aria-label="Open menu"
            variant="ghost"
            size="sm"
            color="ink"
            onClick={() => setOpen(true)}
          >
            <LuMenu />
          </IconButton>
        </Flex>

        <Box
          as="main"
          flex="1"
          px={{ base: "4", md: "8" }}
          py={{ base: "6", md: "8" }}
        >
          <Box maxW="1200px" mx="auto" w="full">
            {children}
          </Box>
        </Box>
      </Flex>

      {/* Mobile drawer */}
      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.700" />
          <Drawer.Positioner>
            <Drawer.Content
              bg="panel"
              maxW="260px"
              borderRightWidth="1px"
              borderColor="line"
            >
              <Drawer.CloseTrigger
                asChild
                position="absolute"
                top="3"
                right="3"
                zIndex="1"
              >
                <IconButton
                  aria-label="Close menu"
                  variant="ghost"
                  size="sm"
                  color="muted"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
              <SidebarInner onNavigate={() => setOpen(false)} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Flex>
  );
}
