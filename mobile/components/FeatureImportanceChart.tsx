import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Feature {
  feature: string;
  importance: number;
}

interface Props {
  features: Feature[];
}

export default function FeatureImportanceChart({ features }: Props) {
  const top5 = features.slice(0, 5);
  if (top5.length === 0) return null;

  const maxImp = Math.max(...top5.map((f) => Math.abs(f.importance)));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Features</Text>
      {top5.map((f, i) => {
        const width = maxImp > 0 ? (Math.abs(f.importance) / maxImp) * 100 : 0;
        return (
          <View key={i} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>{f.feature}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${width}%` }]} />
            </View>
            <Text style={styles.value}>{f.importance.toFixed(4)}</Text>
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
  },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 8 },
  label: { width: 100, color: Colors.textSecondary, fontSize: FontSize.xs },
  barTrack: { flex: 1, height: 12, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm },
  barFill: { height: 12, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm },
  value: { width: 55, color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right' },
});
