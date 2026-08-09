"use client";

// Admin access gate for the whole /admin surface.
//
// Why this is a client component, not a server component: the session is a JWT
// held in localStorage (shared with eventinbox-dashboard), which the server
// can't read during render. So the guard runs on the client and gates in three
// layers, cheapest-first:
//
//   1. authenticated?      — a token exists and isn't expired           (local)
//   2. is_admin claim?     — the JWT carries `is_admin: true`           (local)
//   3. server confirms?    — GET /api/v1/admin/stats returns 200        (network)
//
// Layers 1–2 are a fast UX short-circuit only. Layer 3 (and the IP whitelist in
// middleware.ts) is the real boundary: the API gates every admin route, so a
// forged client claim still gets 401/403/404 and is denied here. On any denial
// we bounce to /signin with ?message=Access denied.

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LuShieldAlert } from "react-icons/lu";
import { Logo } from "@/components/ui/logo";
import { ErrorState } from "@/components/ui/states";
import { useAuth } from "./auth-context";
import { useAdminAccess } from "./use-admin-access";

const DENIED_REDIRECT = "/signin?message=Access%20denied";

/** Neutral structural splash shown while auth hydrates / the probe runs. */
function GuardSplash() {
  return (
    <Flex minH="100dvh" align="center" justify="center" bg="canvas">
      <Stack gap="4" align="center" w="240px">
        <Logo />
        <Box className="ei-shimmer" h="3" w="full" borderRadius="full" />
        <Box className="ei-shimmer" h="3" w="60%" borderRadius="full" />
        <Text fontFamily="mono" fontSize="xs" color="muted">
          verifying admin access…
        </Text>
      </Stack>
    </Flex>
  );
}

function DeniedScreen({ onLeave }: { onLeave: () => void }) {
  return (
    <Flex minH="100dvh" align="center" justify="center" bg="canvas" p="6">
      <Stack
        gap="4"
        align="center"
        textAlign="center"
        maxW="380px"
        bg="panel"
        borderWidth="1px"
        borderColor="line"
        borderRadius="xl"
        p="10"
      >
        <Flex
          align="center"
          justify="center"
          boxSize="12"
          borderRadius="full"
          bg="rgba(220,38,38,0.08)"
          color="red.400"
        >
          <Icon as={LuShieldAlert} boxSize="6" />
        </Flex>
        <Text fontSize="lg" fontWeight="semibold" color="ink">
          Access denied
        </Text>
        <Text fontSize="sm" color="muted">
          This area is restricted to EventInbox administrators. Your account
          doesn&apos;t have admin access.
        </Text>
        <Button colorPalette="brand" color="brand.contrast" onClick={onLeave}>
          Back to sign in
        </Button>
      </Stack>
    </Flex>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, isAuthenticated, signOut } = useAuth();
  const access = useAdminAccess();

  // Denied = a valid session that simply isn't an admin. Clear it so the sign-in
  // screen shows the form (and never bounces them back here in a loop).
  function leave() {
    signOut();
    router.replace(DENIED_REDIRECT);
  }

  // Not signed in at all → straight to /signin (carry the access-denied notice).
  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace(DENIED_REDIRECT);
    }
  }, [ready, isAuthenticated, router]);

  // Auth still hydrating, redirecting, or the admin probe is in flight.
  if (!ready || !isAuthenticated || access.status === "loading") {
    return <GuardSplash />;
  }

  // Signed in but not an admin (local claim missing or server returned 401/403/404).
  if (access.status === "denied") {
    return <DeniedScreen onLeave={leave} />;
  }

  // A transient/non-auth failure (network, 5xx) — let them retry, don't deny.
  if (access.status === "error") {
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="canvas" p="6">
        <Box maxW="420px" w="full">
          <ErrorState message={access.error} onRetry={access.retry} />
        </Box>
      </Flex>
    );
  }

  return <>{children}</>;
}
