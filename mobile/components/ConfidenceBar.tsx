import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  confidence: number;
}

export default function ConfidenceBar({ confidence }: Props) {
  const pct = Math.round(confidence * 100);
  const barColor = pct >= 70 ? Colors.up : pct >= 50 ? Colors.warning : Colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Confidence</Text>
        <Text style={[styles.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm },
  pct: { fontSize: FontSize.sm, fontWeight: '700' },
  track: { height: 8, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full },
  fill: { height: 8, borderRadius: BorderRadius.full },
});
