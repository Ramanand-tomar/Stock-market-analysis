import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  ticker: string;
  companyName: string;
  sector: string;
  onPress: () => void;
}

export default function StockCard({ ticker, companyName, sector, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.ticker}>{ticker.replace('.NS', '')}</Text>
        <Text style={styles.name} numberOfLines={1}>{companyName}</Text>
        <View style={styles.sectorBadge}>
          <Text style={styles.sectorText}>{sector}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1 },
  ticker: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  name: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  sectorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  sectorText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
