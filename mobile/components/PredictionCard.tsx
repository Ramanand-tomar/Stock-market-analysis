import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import ConfidenceBar from './ConfidenceBar';

interface Props {
  predictedClose: number;
  direction: number;
  confidence: number;
  modelUsed: string;
  insight: string;
  cached: boolean;
}

export default function PredictionCard({ predictedClose, direction, confidence, modelUsed, insight, cached }: Props) {
  const isUp = direction === 1;
  const dirColor = isUp ? Colors.up : Colors.down;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>AI Prediction</Text>
        {cached && <Text style={styles.cached}>CACHED</Text>}
      </View>

      <View style={styles.row}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Predicted Close</Text>
          <Text style={styles.price}>{predictedClose.toFixed(2)}</Text>
        </View>
        <View style={[styles.dirBadge, { backgroundColor: dirColor + '20' }]}>
          <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={24} color={dirColor} />
          <Text style={[styles.dirText, { color: dirColor }]}>{isUp ? 'UP' : 'DOWN'}</Text>
        </View>
      </View>

      <ConfidenceBar confidence={confidence} />

      <View style={styles.insightBox}>
        <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
        <Text style={styles.insightText}>{insight}</Text>
      </View>

      <Text style={styles.model}>Model: {modelUsed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  label: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  cached: { color: Colors.textMuted, fontSize: FontSize.xs, backgroundColor: Colors.surfaceLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  priceBlock: {},
  priceLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  price: { color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '800' },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  dirText: { fontSize: FontSize.lg, fontWeight: '700' },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: 8,
  },
  insightText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  model: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.md },
});
