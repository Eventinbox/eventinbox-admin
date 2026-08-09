"use client";

import {
  Badge,
  Box,
  Flex,
  IconButton,
  Switch,
  Table,
  Text,
} from "@chakra-ui/react";
import { LuBan, LuTrash2, LuUndo2 } from "react-icons/lu";
import { StatusDot } from "@/components/ui/status-dot";
import { formatRelative } from "@/lib/format";
import type { AdminUser } from "@/lib/types";

export interface RowHandlers {
  onToggleAdmin: (user: AdminUser, next: boolean) => void;
  onSuspend: (user: AdminUser) => void;
  onUnsuspend: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  // user ids with an action currently in flight — their row controls disable
  busy: Set<string>;
}

export function UsersTable({
  users,
  handlers,
}: {
  users: AdminUser[];
  handlers: RowHandlers;
}) {
  return (
    <Box overflowX="auto">
      <Table.Root size="sm" className="ei-table">
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader color="muted">Email</Table.ColumnHeader>
            <Table.ColumnHeader color="muted">Name</Table.ColumnHeader>
            <Table.ColumnHeader color="muted">Created</Table.ColumnHeader>
            <Table.ColumnHeader color="muted">Status</Table.ColumnHeader>
            <Table.ColumnHeader color="muted" className="ei-num">
              Workspaces
            </Table.ColumnHeader>
            <Table.ColumnHeader color="muted">Admin</Table.ColumnHeader>
            <Table.ColumnHeader color="muted" textAlign="right">
              Actions
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((u) => {
            const verified = u.email_verified_at != null;
            const suspended = u.suspended_at != null;
            const busy = handlers.busy.has(u.id);
            return (
              <Table.Row
                key={u.id}
                bg="transparent"
                _hover={{ bg: "panelHover" }}
                opacity={suspended ? 0.6 : 1}
              >
                <Table.Cell maxW="240px">
                  <Text
                    fontFamily="mono"
                    fontSize="sm"
                    color="brand.solid"
                    truncate
                    title={u.email}
                  >
                    {u.email}
                  </Text>
                </Table.Cell>
                <Table.Cell color="ink" fontSize="sm">
                  {u.full_name || "—"}
                </Table.Cell>
                <Table.Cell color="muted" fontSize="sm" fontFamily="mono">
                  {formatRelative(u.created_at)}
                </Table.Cell>
                <Table.Cell>
                  {suspended ? (
                    <Badge colorPalette="red" variant="subtle" fontFamily="mono">
                      <StatusDot status="failed" /> suspended
                    </Badge>
                  ) : (
                    <Flex align="center" gap="1.5">
                      <StatusDot status={verified ? "active" : "pending"} />
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color={verified ? "green.400" : "yellow.400"}
                      >
                        {verified ? "verified" : "pending"}
                      </Text>
                    </Flex>
                  )}
                </Table.Cell>
                <Table.Cell
                  color="ink"
                  fontSize="sm"
                  fontFamily="mono"
                  className="ei-num"
                >
                  {u.workspace_count}
                </Table.Cell>
                <Table.Cell>
                  <Switch.Root
                    size="sm"
                    colorPalette="brand"
                    checked={Boolean(u.is_admin)}
                    disabled={busy}
                    onCheckedChange={(e) => handlers.onToggleAdmin(u, e.checked)}
                  >
                    <Switch.HiddenInput
                      aria-label={`Admin access for ${u.email}`}
                    />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label
                      fontFamily="mono"
                      fontSize="xs"
                      color={u.is_admin ? "green.400" : "muted"}
                    >
                      {u.is_admin ? "on" : "off"}
                    </Switch.Label>
                  </Switch.Root>
                </Table.Cell>
                <Table.Cell>
                  <Flex justify="flex-end" gap="1">
                    {suspended ? (
                      <IconButton
                        aria-label="Unsuspend user"
                        title="Unsuspend"
                        size="xs"
                        variant="ghost"
                        color="muted"
                        disabled={busy}
                        _hover={{ color: "green.400", bg: "panelHover" }}
                        onClick={() => handlers.onUnsuspend(u)}
                      >
                        <LuUndo2 />
                      </IconButton>
                    ) : (
                      <IconButton
                        aria-label="Suspend user"
                        title="Suspend"
                        size="xs"
                        variant="ghost"
                        color="muted"
                        disabled={busy}
                        _hover={{ color: "yellow.400", bg: "panelHover" }}
                        onClick={() => handlers.onSuspend(u)}
                      >
                        <LuBan />
                      </IconButton>
                    )}
                    <IconButton
                      aria-label="Delete user"
                      title="Delete"
                      size="xs"
                      variant="ghost"
                      color="muted"
                      disabled={busy}
                      _hover={{ color: "red.400", bg: "panelHover" }}
                      onClick={() => handlers.onDelete(u)}
                    >
                      <LuTrash2 />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
      {users.length === 0 && (
        <Flex justify="center" py="10">
          <Text color="muted" fontSize="sm">
            No users match this search.
          </Text>
        </Flex>
      )}
    </Box>
  );
}
