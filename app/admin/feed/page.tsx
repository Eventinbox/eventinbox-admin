"use client";

import {
  Box,
  Flex,
  Grid,
  IconButton,
  NativeSelect,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuRotateCw } from "react-icons/lu";
import { LiveDot } from "@/components/ui/live-dot";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ErrorState } from "@/components/ui/states";
import { StatusDot } from "@/components/ui/status-dot";
import { adminApi } from "@/lib/api-client";
import { formatClock } from "@/lib/format";
import { statusVisual } from "@/lib/status";
import type { AdminFeedRow } from "@/lib/types";
import { usePoll } from "@/lib/use-poll";

const GRID = "78px minmax(120px, 1.3fr) minmax(90px, 1fr) 100px 48px 56px";

interface FeedItem extends AdminFeedRow {
  key: string;
  // The /admin/feed payload is metadata-only (no event id), so per-row replay
  // stays disabled until the API exposes ids. Keep the field so the button
  // lights up automatically once it does.
  eventId?: string;
}

async function loadFeed(signal: AbortSignal): Promise<FeedItem[]> {
  const rows = await adminApi.feed({ limit: 100 }, signal);
  return rows.map((r) => ({
    ...r,
    key: `${r.created_at}|${r.event_type}|${r.endpoint_host}|${r.status}|${r.attempts}`,
  }));
}

export default function AdminFeedPage() {
  const { data, error, live, lastUpdated, refresh } = usePoll<FeedItem[]>(
    loadFeed,
    5000,
  );
  const [host, setHost] = useState<string>("all");

  const items = useMemo(() => data ?? [], [data]);

  // Distinct endpoint hosts seen in the current window — the filter dimension
  // the cross-tenant feed actually exposes (no workspace name is returned).
  const hosts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.endpoint_host && set.add(i.endpoint_host));
    return Array.from(set).sort();
  }, [items]);

  const visible = useMemo(
    () => (host === "all" ? items : items.filter((i) => i.endpoint_host === host)),
    [items, host],
  );

  // One-shot cyan glow for genuinely new rows between polls.
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const [glow, setGlow] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    const keys = data.map((d) => d.key);
    if (!primed.current) {
      keys.forEach((k) => seen.current.add(k));
      primed.current = true;
      return;
    }
    const fresh = keys.filter((k) => !seen.current.has(k));
    if (fresh.length === 0) return;
    fresh.forEach((k) => seen.current.add(k));
    setGlow((prev) => new Set([...prev, ...fresh]));
    const t = setTimeout(() => {
      setGlow((prev) => {
        const next = new Set(prev);
        fresh.forEach((k) => next.delete(k));
        return next;
      });
    }, 1600);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <Box>
      <PageHeader
        title="Live feed"
        description="Cross-tenant delivery stream, refreshing every 5 seconds."
        action={
          <NativeSelect.Root size="sm" width="240px">
            <NativeSelect.Field
              value={host}
              onChange={(e) => setHost(e.currentTarget.value)}
              bg="panel"
              borderColor="line"
              color="ink"
              fontFamily="mono"
              fontSize="sm"
            >
              <option value="all">All endpoints</option>
              {hosts.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        }
      />

      <Panel className={live ? "ei-live-panel" : undefined} overflow="hidden">
        <Flex
          align="center"
          justify="space-between"
          px="4"
          py="3"
          borderBottomWidth="1px"
          borderColor="line"
        >
          <Flex align="center" gap="3">
            <LiveDot live={live} />
            <Text fontSize="sm" fontWeight="semibold" color="ink">
              {host === "all" ? "All workspaces" : host}
            </Text>
            <Text fontFamily="mono" fontSize="xs" color="muted">
              {visible.length} event{visible.length === 1 ? "" : "s"}
            </Text>
          </Flex>
          <Text
            key={lastUpdated ?? "init"}
            as="button"
            onClick={refresh}
            fontFamily="mono"
            fontSize="0.65rem"
            color="muted"
            _hover={{ color: "brand.solid" }}
            title="Refresh now"
            css={lastUpdated ? { animation: "ei-flash 0.9s ease-out" } : undefined}
          >
            {lastUpdated
              ? `rx ${formatClock(new Date(lastUpdated).toISOString())}`
              : "connecting…"}
          </Text>
        </Flex>

        {/* Column legend */}
        <Grid
          templateColumns={GRID}
          gap="3"
          px="4"
          py="1.5"
          fontFamily="mono"
          fontSize="0.6rem"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="muted"
          borderBottomWidth="1px"
          borderColor="line"
        >
          <Text>time</Text>
          <Text>event</Text>
          <Text>endpoint</Text>
          <Text>status</Text>
          <Text textAlign="right">try</Text>
          <Text textAlign="right">replay</Text>
        </Grid>

        <Box maxH="560px" overflowY="auto">
          {error && visible.length === 0 ? (
            <Box p="4">
              <ErrorState message={error} onRetry={refresh} />
            </Box>
          ) : visible.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py="12" gap="1">
              <Text fontFamily="mono" fontSize="sm" color="muted">
                waiting for deliveries…
              </Text>
              <Text fontFamily="mono" fontSize="xs" color="muted" opacity="0.6">
                events across every workspace stream in here
              </Text>
            </Flex>
          ) : (
            visible.map((item) => (
              <FeedRow key={item.key} item={item} glow={glow.has(item.key)} />
            ))
          )}
        </Box>
      </Panel>
    </Box>
  );
}

function FeedRow({ item, glow }: { item: FeedItem; glow: boolean }) {
  const { color } = statusVisual(item.status);
  const canReplay = Boolean(item.eventId);
  return (
    <Grid
      templateColumns={GRID}
      gap="3"
      alignItems="center"
      px="4"
      py="1.5"
      borderTopWidth="1px"
      borderColor="line"
      fontFamily="mono"
      fontSize="xs"
      _hover={{ bg: "panelHover" }}
      css={{
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum", "zero", "ss01"',
        ...(glow ? { animation: "ei-feed-enter 1.5s ease-out" } : {}),
      }}
    >
      <Text color="muted" whiteSpace="nowrap">
        {formatClock(item.created_at)}
      </Text>
      <Text color="brand.fg" truncate title={item.event_type}>
        {item.event_type || "event"}
      </Text>
      <Text color="ink" truncate title={item.endpoint_host}>
        {item.endpoint_host || "—"}
      </Text>
      <Flex align="center" gap="1.5" minW="0">
        <StatusDot status={item.status} />
        <Text color={color} truncate>
          {item.status}
        </Text>
      </Flex>
      <Text color="muted" textAlign="right" whiteSpace="nowrap">
        {item.attempts}
      </Text>
      <Flex justify="flex-end">
        <IconButton
          aria-label="Replay event"
          title={
            canReplay
              ? "Replay this delivery"
              : "Replay needs an event id — not exposed by the cross-tenant feed yet"
          }
          size="xs"
          variant="ghost"
          color="muted"
          disabled={!canReplay}
          _hover={{ color: "brand.solid", bg: "panelHover" }}
          onClick={() => item.eventId && adminApi.replayEvent(item.eventId)}
        >
          <LuRotateCw />
        </IconButton>
      </Flex>
    </Grid>
  );
}
