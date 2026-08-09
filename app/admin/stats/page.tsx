"use client";

import { Box, Button, Flex, Icon, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import {
  LuActivity,
  LuBuilding2,
  LuCircleCheck,
  LuRadioTower,
  LuRefreshCw,
  LuUsers,
} from "react-icons/lu";
import { LiveDot } from "@/components/ui/live-dot";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, LoadingCards } from "@/components/ui/states";
import { TrendChart, type TrendPoint } from "@/components/admin/trend-chart";
import { adminApi } from "@/lib/api-client";
import type { AdminStats } from "@/lib/types";
import { useFetch } from "@/lib/use-fetch";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Illustrative 7-day delivery-success trend. The API exposes a single 24h rate
// (success_rate_24h), not a daily history, so we synthesize a stable series
// anchored on that real value — deterministic (no RNG) so it never flickers or
// mismatches on hydration. Swap for a real /admin/stats/history feed when it
// lands; the chart contract (TrendPoint[]) won't change.
function buildTrend(rate: number | null): TrendPoint[] {
  const anchor = rate == null ? 0.985 : rate;
  // Gentle deterministic wobble (±) leading up to today's real value.
  const wobble = [-0.018, 0.006, -0.01, 0.012, -0.004, 0.009, 0];
  const today = new Date().getDay();
  return wobble.map((w, i) => {
    const dayIdx = (today - (6 - i) + 7 * 2) % 7;
    return {
      label: DAY[dayIdx],
      value: Math.min(1, Math.max(0, anchor + w)),
    };
  });
}

export default function AdminStatsPage() {
  const { data, error, loading, refetch } = useFetch((signal) =>
    adminApi.stats(signal),
  );

  if (loading) {
    return (
      <Box>
        <PageHeader title="System overview" description="Loading metrics…" />
        <LoadingCards count={5} />
        <Box mt="6">
          <LoadingCards count={1} />
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <PageHeader title="System overview" />
        <ErrorState
          message={error ?? "No stats returned."}
          onRetry={refetch}
        />
      </Box>
    );
  }

  return <StatsView stats={data} onRefresh={refetch} />;
}

function StatsView({
  stats,
  onRefresh,
}: {
  stats: AdminStats;
  onRefresh: () => void;
}) {
  const rate = stats.deliveries.success_rate_24h;
  const trend = useMemo(() => buildTrend(rate), [rate]);

  return (
    <Box>
      <PageHeader
        title="System overview"
        description="Cross-tenant metrics across every workspace."
        action={
          <Button
            size="sm"
            variant="outline"
            colorPalette="brand"
            onClick={onRefresh}
          >
            <LuRefreshCw /> Refresh
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap="4">
        <StatCard
          label="Total events"
          value={stats.events.total.toLocaleString()}
          icon={LuActivity}
          hint={`${stats.events.last_24h.toLocaleString()} in last 24h`}
        />
        <StatCard
          label="Delivery success (24h)"
          value={rate == null ? "—" : `${(rate * 100).toFixed(1)}%`}
          icon={LuCircleCheck}
          accent
          glow={rate != null && rate >= 0.99}
          hint={`${stats.deliveries.delivered_24h.toLocaleString()} ok · ${stats.deliveries.failed_24h.toLocaleString()} failed`}
        />
        <StatCard
          label="Endpoints"
          value={stats.endpoints.toLocaleString()}
          icon={LuRadioTower}
          hint="across all workspaces"
        />
        <StatCard
          label="Total users"
          value={stats.users.toLocaleString()}
          icon={LuUsers}
          hint={`${stats.verified_users.toLocaleString()} verified`}
        />
        <StatCard
          label="Workspaces"
          value={stats.workspaces.toLocaleString()}
          icon={LuBuilding2}
          hint={`${stats.deliveries.total.toLocaleString()} deliveries all-time`}
        />
      </SimpleGrid>

      <Panel mt="6">
        <PanelHeader
          title="Delivery success — last 7 days"
          description="Share of settled deliveries that succeeded."
          action={
            <Flex align="center" gap="3">
              <LiveDot live={false} label="7D" />
              <Text fontFamily="mono" fontSize="xs" color="muted">
                {rate == null ? "—" : `${(rate * 100).toFixed(1)}% today`}
              </Text>
            </Flex>
          }
        />
        <Box p="5">
          <TrendChart points={trend} />
          <Flex align="center" gap="2" mt="4" color="muted">
            <Icon as={LuActivity} boxSize="3.5" />
            <Text fontSize="xs" fontFamily="mono">
              Trend is illustrative — anchored on today&apos;s real 24h success
              rate until the API exposes a daily history.
            </Text>
          </Flex>
        </Box>
      </Panel>
    </Box>
  );
}
