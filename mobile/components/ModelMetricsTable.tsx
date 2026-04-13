import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  models: Record<string, any>;
  type: 'regression' | 'classification';
}

export default function ModelMetricsTable({ models, type }: Props) {
  const entries = Object.entries(models);
  if (entries.length === 0) {
    return <Text style={styles.empty}>No model metrics available</Text>;
  }

  const isReg = type === 'regression';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Model</Text>
          {isReg ? (
            <>
              <Text style={[styles.cell, styles.headerText]}>RMSE</Text>
              <Text style={[styles.cell, styles.headerText]}>MAE</Text>
              <Text style={[styles.cell, styles.headerText]}>R²</Text>
            </>
          ) : (
            <>
              <Text style={[styles.cell, styles.headerText]}>Accuracy</Text>
              <Text style={[styles.cell, styles.headerText]}>F1</Text>
              <Text style={[styles.cell, styles.headerText]}>Precision</Text>
              <Text style={[styles.cell, styles.headerText]}>Recall</Text>
            </>
          )}
        </View>

        {/* Rows */}
        {entries.map(([name, m]) => {
          const isBest = m.best === true;
          const val = m.val || {};
          return (
            <View key={name} style={[styles.row, isBest && styles.bestRow]}>
              <View style={[styles.cell, styles.nameCell, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                {isBest && <Ionicons name="star" size={14} color={Colors.warning} />}
                <Text style={styles.cellText} numberOfLines={1}>{name.replace(/_/g, ' ')}</Text>
              </View>
              {isReg ? (
                <>
                  <Text style={[styles.cell, styles.cellText]}>{val.rmse?.toFixed(2) ?? '-'}</Text>
                  <Text style={[styles.cell, styles.cellText]}>{val.mae?.toFixed(2) ?? '-'}</Text>
                  <Text style={[styles.cell, styles.cellText]}>{val.r2?.toFixed(4) ?? '-'}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.cell, styles.cellText]}>{((val.accuracy ?? 0) * 100).toFixed(1)}%</Text>
                  <Text style={[styles.cell, styles.cellText]}>{(val.f1 ?? 0).toFixed(3)}</Text>
                  <Text style={[styles.cell, styles.cellText]}>{(val.precision ?? 0).toFixed(3)}</Text>
                  <Text style={[styles.cell, styles.cellText]}>{(val.recall ?? 0).toFixed(3)}</Text>
                </>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  bestRow: { backgroundColor: Colors.warning + '10' },
  cell: { width: 80, paddingHorizontal: 4 },
  nameCell: { width: 130 },
  headerText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '700' },
  cellText: { color: Colors.text, fontSize: FontSize.sm },
  empty: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xxl },
});
