import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import type { Cluster } from '../api/insights';

const CLUSTER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface Props {
  cluster: Cluster;
}

export default function ClusterCard({ cluster }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length];

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>C{cluster.cluster_id}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>{cluster.label}</Text>
          <Text style={styles.count}>{cluster.count} stocks</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textMuted}
        />
      </Pressable>

      <Text style={styles.description}>{cluster.description}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatChip label="Beta" value={cluster.avg_stats.beta.toFixed(2)} />
        <StatChip label="Vol" value={cluster.avg_stats.volatility.toFixed(2)} />
        <StatChip label="PE" value={cluster.avg_stats.mean_pe.toFixed(1)} />
      </View>

      {expanded && (
        <View style={styles.membersList}>
          {cluster.members.map((m) => (
            <View key={m.ticker} style={styles.memberRow}>
              <Text style={styles.memberTicker}>{m.ticker.replace('.NS', '')}</Text>
              <Text style={styles.memberSector}>{m.sector}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: FontSize.sm, fontWeight: '800' },
  headerText: { flex: 1 },
  label: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  count: { color: Colors.textMuted, fontSize: FontSize.sm },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  statChip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  statValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700' },
  membersList: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  memberTicker: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
  memberSector: { color: Colors.textMuted, fontSize: FontSize.sm },
});
