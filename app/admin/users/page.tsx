"use client";

import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ErrorState, LoadingRows } from "@/components/ui/states";
import { toaster } from "@/components/ui/toaster";
import { RowHandlers, UsersTable } from "@/components/admin/users-table";
import { adminApi, ApiError } from "@/lib/api-client";
import type { AdminUser } from "@/lib/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useFetch } from "@/lib/use-fetch";

const PAGE_SIZE = 10;

type ActionKind = "admin" | "suspend" | "unsuspend" | "delete";

interface PendingAction {
  kind: ActionKind;
  user: AdminUser;
  nextAdmin?: boolean;
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [page, setPage] = useState(0);

  // A new search resets to the first page.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  const offset = page * PAGE_SIZE;
  const { data, error, loading, refetch, setData } = useFetch(
    (signal) =>
      adminApi.users(
        { limit: PAGE_SIZE, offset, q: debouncedQuery || undefined },
        signal,
      ),
    [debouncedQuery, offset],
  );

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const total = data?.total ?? 0;
  const users = data?.users ?? [];
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = page > 0;
  const hasNext = offset + PAGE_SIZE < total;

  function patchUser(id: string, patch: Partial<AdminUser>) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          }
        : prev,
    );
  }

  const handlers: RowHandlers = {
    busy,
    onToggleAdmin: (user, next) =>
      setPending({ kind: "admin", user, nextAdmin: next }),
    onSuspend: (user) => setPending({ kind: "suspend", user }),
    onUnsuspend: (user) => setPending({ kind: "unsuspend", user }),
    onDelete: (user) => setPending({ kind: "delete", user }),
  };

  async function runAction(action: PendingAction) {
    const { kind, user } = action;
    setBusy((s) => new Set(s).add(user.id));
    try {
      if (kind === "admin") {
        const next = action.nextAdmin ?? !user.is_admin;
        const res = await adminApi.setAdmin(user.id, next);
        // Trust the flag the API persisted over the one we optimistically sent,
        // so the switch can't drift from the server if the write was coerced.
        const applied = res?.is_admin ?? next;
        patchUser(user.id, { is_admin: applied });
        toaster.create({
          type: "success",
          title: applied ? "Admin granted" : "Admin revoked",
          description: user.email,
        });
      } else if (kind === "suspend") {
        await adminApi.suspendUser(user.id);
        // Stamp a suspended_at so the row reflects it immediately.
        patchUser(user.id, { suspended_at: new Date().toISOString() });
        toaster.create({
          type: "success",
          title: "User suspended",
          description: user.email,
        });
      } else if (kind === "unsuspend") {
        await adminApi.unsuspendUser(user.id);
        patchUser(user.id, { suspended_at: null });
        toaster.create({
          type: "success",
          title: "Suspension lifted",
          description: user.email,
        });
      } else if (kind === "delete") {
        await adminApi.deleteUser(user.id);
        toaster.create({
          type: "success",
          title: "User deleted",
          description: user.email,
        });
        // Totals/pagination shift server-side — resync from the API.
        refetch();
      }
    } catch (err) {
      toaster.create({
        type: "error",
        title: "Action failed",
        description:
          err instanceof ApiError
            ? err.message
            : "Couldn't complete the request.",
      });
    } finally {
      setBusy((s) => {
        const next = new Set(s);
        next.delete(user.id);
        return next;
      });
    }
  }

  return (
    <Box>
      <PageHeader
        title="Users"
        description="Every account across all workspaces."
      />

      <Flex mb="4" maxW="420px" position="relative" align="center">
        <Box
          position="absolute"
          left="3"
          color="muted"
          pointerEvents="none"
          display="flex"
        >
          <LuSearch />
        </Box>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or name…"
          pl="9"
          bg="panel"
          borderColor="line"
          fontFamily="mono"
          fontSize="sm"
          color="ink"
          _placeholder={{ color: "muted" }}
        />
      </Flex>

      <Panel overflow="hidden">
        {loading ? (
          <Box p="5">
            <LoadingRows rows={PAGE_SIZE} />
          </Box>
        ) : error ? (
          <Box p="5">
            <ErrorState message={error} onRetry={refetch} />
          </Box>
        ) : (
          <UsersTable users={users} handlers={handlers} />
        )}

        {!loading && !error && (
          <Flex
            align="center"
            justify="space-between"
            px="5"
            py="3"
            borderTopWidth="1px"
            borderColor="line"
          >
            <Text fontSize="xs" fontFamily="mono" color="muted">
              {total === 0
                ? "no users"
                : `${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()}`}
            </Text>
            <Flex gap="2">
              <Button
                size="xs"
                variant="outline"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <LuChevronLeft /> Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <LuChevronRight />
              </Button>
            </Flex>
          </Flex>
        )}
      </Panel>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? confirmCopy(pending).title : ""}
        body={pending ? confirmCopy(pending).body : ""}
        confirmLabel={pending ? confirmCopy(pending).confirmLabel : "Confirm"}
        destructive={pending?.kind === "delete"}
        onConfirm={async () => {
          if (pending) await runAction(pending);
        }}
        onClose={() => setPending(null)}
      />
    </Box>
  );
}

function confirmCopy(action: PendingAction): {
  title: string;
  body: string;
  confirmLabel: string;
} {
  const { user } = action;
  switch (action.kind) {
    case "admin":
      return action.nextAdmin
        ? {
            title: "Grant admin access?",
            body: `${user.email} will gain full cross-tenant admin access to every workspace.`,
            confirmLabel: "Grant admin",
          }
        : {
            title: "Revoke admin access?",
            body: `${user.email} will lose admin access to the console.`,
            confirmLabel: "Revoke admin",
          };
    case "suspend":
      return {
        title: "Suspend this user?",
        body: `${user.email} will be blocked from signing in and using the API until unsuspended. No data is deleted.`,
        confirmLabel: "Suspend",
      };
    case "unsuspend":
      return {
        title: "Lift suspension?",
        body: `${user.email} will regain access to their account.`,
        confirmLabel: "Unsuspend",
      };
    case "delete":
      return {
        title: "Delete this user?",
        body: `${user.email} and all of their workspaces will be permanently deleted. This cannot be undone.`,
        confirmLabel: "Delete permanently",
      };
  }
}
