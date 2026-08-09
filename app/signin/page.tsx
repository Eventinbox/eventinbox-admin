"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LuShieldAlert, LuShieldCheck } from "react-icons/lu";
import { AdminLogo } from "@/components/admin/admin-logo";
import { Label } from "@/components/ui/typography";
import { adminApi, api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <Stack gap="1.5">
      <Label>{label}</Label>
      <Input
        bg="well"
        borderColor="line"
        color="ink"
        fontFamily="mono"
        fontSize="sm"
        _placeholder={{ color: "muted" }}
        {...props}
      />
    </Stack>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signInWith, signOut, isAuthenticated, ready } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = params.get("next") || "/admin/stats";
  // The guard/middleware bounce here with ?message=Access denied.
  const notice = params.get("message");

  // Already signed in? Send them on — the admin gate on /admin is authoritative
  // (and signs out non-admins), so this never traps a non-admin in a loop.
  useEffect(() => {
    if (ready && isAuthenticated) router.replace(next);
  }, [ready, isAuthenticated, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const auth = await api.signin(email, password);
      // Establish the session first so the admin probe carries the Bearer token.
      signInWith(auth);
      // Admin status isn't in the JWT — confirm it against the API. A 200 means
      // admin; 401/403/404 means a valid account that simply isn't an admin.
      try {
        await adminApi.stats();
      } catch (probeErr) {
        if (
          probeErr instanceof ApiError &&
          [401, 403, 404].includes(probeErr.status)
        ) {
          signOut();
          setError(
            "This account doesn't have admin access. Contact an existing admin if you believe this is a mistake.",
          );
          setSubmitting(false);
          return;
        }
        throw probeErr;
      }
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Sign in failed. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Flex minH="100dvh" align="center" justify="center" bg="canvas" p="6">
      <Box
        w="full"
        maxW="400px"
        bg="panel"
        borderWidth="1px"
        borderColor="line"
        borderRadius="xl"
        p={{ base: "6", md: "8" }}
      >
        <Stack gap="6">
          <Stack gap="2">
            <AdminLogo />
            <Text fontSize="sm" color="muted">
              Sign in to the EventInbox admin console.
            </Text>
          </Stack>

          {notice && (
            <Flex
              align="center"
              gap="2"
              p="3"
              borderRadius="md"
              bg="rgba(220,38,38,0.07)"
              borderWidth="1px"
              borderColor="red.900"
            >
              <Icon as={LuShieldAlert} color="red.400" flexShrink="0" />
              <Text fontSize="sm" color="ink">
                {notice}
              </Text>
            </Flex>
          )}

          <form onSubmit={onSubmit}>
            <Stack gap="4">
              <Field
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="admin@eventinbox.pro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <Text fontSize="sm" color="red.400" fontFamily="mono">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                colorPalette="brand"
                color="brand.contrast"
                loading={submitting}
                loadingText="Signing in"
                w="full"
              >
                <LuShieldCheck /> Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Flex>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
