import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Feature {
  feature: string;
  importance: number;
}

interface Props {
  features: Feature[];
}

const BAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F97316', '#14B8A6', '#EF4444', '#84CC16',
];

export default function FeatureImportanceChart({ features }: Props) {
  const top = features.slice(0, 8);
  if (top.length === 0) return null;

  const maxImp = Math.max(...top.map((f) => Math.abs(f.importance)));

  return (
    <View style={styles.container}>
      {top.map((f, i) => {
        const width = maxImp > 0 ? (Math.abs(f.importance) / maxImp) * 100 : 0;
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const displayName = f.feature
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <View key={i} style={styles.row}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <View style={styles.featureInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.label} numberOfLines={1}>{displayName}</Text>
                <Text style={[styles.value, { color }]}>{f.importance.toFixed(4)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  featureInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
    marginRight: Spacing.sm,
  },
  value: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
});
