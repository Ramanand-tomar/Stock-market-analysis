import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import ModelRadarChart from './ModelRadarChart';
import ConfusionMatrixChart from './ConfusionMatrixChart';
import AlgorithmVisualizer from './AlgorithmVisualizer';

interface Props {
  name: string;
  data: any;
  type: 'regression' | 'classification';
  index: number;
}

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316',
];

export default function ModelDetailCard({ name, data, type, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isBest = data.best === true;
  const val = data.val || {};
  const test = data.test || {};
  const topFeatures: { feature: string; importance: number }[] = data.top_features || [];
  const color = isBest ? Colors.secondary : CHART_COLORS[index % CHART_COLORS.length];
  const displayName = name.replace(/_/g, ' ');

  const isClassification = type === 'classification';

  // Feature importance max for scaling bars
  const maxImp = topFeatures.length > 0
    ? Math.max(...topFeatures.map((f) => Math.abs(f.importance)))
    : 1;

  return (
    <View style={[styles.card, isBest && styles.bestCard]}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          {isBest && <Ionicons name="star" size={16} color={Colors.warning} />}
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {isBest && <Text style={styles.bestBadge}>Best</Text>}
        </View>
        <View style={styles.headerRight}>
          {/* Quick metric preview */}
          {isClassification ? (
            <Text style={styles.quickMetric}>F1: {(val.f1 ?? 0).toFixed(3)}</Text>
          ) : (
            <Text style={styles.quickMetric}>R²: {(val.r2 ?? 0).toFixed(4)}</Text>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {/* Algorithm illustration — How It Works */}
          <AlgorithmVisualizer modelName={name} type={type} />

          {/* Val vs Test comparison */}
          <Text style={styles.sectionTitle}>Validation vs Test</Text>
          <View style={styles.compareGrid}>
            {isClassification ? (
              <>
                <MetricRow label="Accuracy" valVal={val.accuracy} testVal={test.accuracy} pct />
                <MetricRow label="F1 Score" valVal={val.f1} testVal={test.f1} />
                <MetricRow label="Precision" valVal={val.precision} testVal={test.precision} />
                <MetricRow label="Recall" valVal={val.recall} testVal={test.recall} />
              </>
            ) : (
              <>
                <MetricRow label="RMSE" valVal={val.rmse} testVal={test.rmse} lower />
                <MetricRow label="MAE" valVal={val.mae} testVal={test.mae} lower />
                <MetricRow label="R²" valVal={val.r2} testVal={test.r2} />
              </>
            )}
          </View>

          {/* Val vs Test bar comparison */}
          <ValTestBars val={val} test={test} type={type} color={color} />

          {/* Radar chart for classification */}
          {isClassification && val.accuracy != null && (
            <ModelRadarChart
              modelName={name}
              metrics={{
                accuracy: val.accuracy ?? 0,
                f1: val.f1 ?? 0,
                precision: val.precision ?? 0,
                recall: val.recall ?? 0,
              }}
              isBest={isBest}
              color={color}
            />
          )}

          {/* Confusion matrix */}
          {isClassification && val.confusion_matrix && (
            <View style={styles.cmSection}>
              <Text style={styles.sectionTitle}>Confusion Matrix</Text>
              <View style={styles.cmRow}>
                <View style={styles.cmItem}>
                  <Text style={styles.cmLabel}>Validation</Text>
                  <ConfusionMatrixChart matrix={val.confusion_matrix} modelName="Validation" />
                </View>
                {test.confusion_matrix && (
                  <View style={styles.cmItem}>
                    <Text style={styles.cmLabel}>Test</Text>
                    <ConfusionMatrixChart matrix={test.confusion_matrix} modelName="Test" />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Feature importance */}
          {topFeatures.length > 0 && (
            <View style={styles.featSection}>
              <Text style={styles.sectionTitle}>Top Features</Text>
              {topFeatures.slice(0, 8).map((f, i) => {
                const barW = maxImp > 0 ? (Math.abs(f.importance) / maxImp) * 100 : 0;
                return (
                  <View key={i} style={styles.featRow}>
                    <Text style={styles.featLabel} numberOfLines={1}>
                      {f.feature.replace(/_/g, ' ')}
                    </Text>
                    <View style={styles.featBarTrack}>
                      <View style={[styles.featBarFill, { width: `${barW}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.featValue}>{f.importance.toFixed(4)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Ensemble info */}
          {data.ensemble_of && (
            <View style={styles.ensembleBox}>
              <Ionicons name="git-merge" size={14} color={Colors.primaryLight} />
              <Text style={styles.ensembleText}>
                Ensemble of: {data.ensemble_of.map((m: string) => m.replace(/_/g, ' ')).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Sub-component: metric row comparison
function MetricRow({ label, valVal, testVal, pct, lower }: {
  label: string; valVal?: number; testVal?: number; pct?: boolean; lower?: boolean;
}) {
  const fmtVal = (v?: number) => {
    if (v == null) return '-';
    return pct ? `${(v * 100).toFixed(1)}%` : v.toFixed(4);
  };

  // Determine if test improved or degraded
  let testColor = Colors.text;
  if (valVal != null && testVal != null) {
    if (lower) {
      testColor = testVal <= valVal ? Colors.up : Colors.down;
    } else {
      testColor = testVal >= valVal ? Colors.up : Colors.down;
    }
  }

  return (
    <View style={metricStyles.row}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.val}>{fmtVal(valVal)}</Text>
      <Text style={[metricStyles.test, { color: testColor }]}>{fmtVal(testVal)}</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  label: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.xs },
  val: { width: 70, color: Colors.text, fontSize: FontSize.xs, textAlign: 'center' },
  test: { width: 70, fontSize: FontSize.xs, textAlign: 'center', fontWeight: '600' },
});

// Sub-component: val vs test grouped mini bars
function ValTestBars({ val, test, type, color }: {
  val: any; test: any; type: string; color: string;
}) {
  const isReg = type === 'regression';
  const metricKeys = isReg
    ? [{ key: 'r2', label: 'R²' }]
    : [
        { key: 'accuracy', label: 'Acc' },
        { key: 'f1', label: 'F1' },
        { key: 'precision', label: 'Prec' },
        { key: 'recall', label: 'Rec' },
      ];

  return (
    <View style={barStyles.container}>
      <View style={barStyles.legend}>
        <View style={barStyles.legendItem}>
          <View style={[barStyles.legendDot, { backgroundColor: color }]} />
          <Text style={barStyles.legendText}>Val</Text>
        </View>
        <View style={barStyles.legendItem}>
          <View style={[barStyles.legendDot, { backgroundColor: color, opacity: 0.4 }]} />
          <Text style={barStyles.legendText}>Test</Text>
        </View>
      </View>
      <View style={barStyles.barsRow}>
        {metricKeys.map(({ key, label }) => {
          const vVal = val[key] ?? 0;
          const tVal = test[key] ?? 0;
          const maxV = Math.max(vVal, tVal, 0.01);
          const scale = isReg ? 1 : 1; // Both 0-1 range
          return (
            <View key={key} style={barStyles.barGroup}>
              <Text style={barStyles.barLabel}>{label}</Text>
              <View style={barStyles.barPair}>
                <View style={barStyles.barTrack}>
                  <View
                    style={[barStyles.barFill, {
                      height: `${(vVal / (isReg ? maxV : 1)) * 100}%`,
                      backgroundColor: color,
                    }]}
                  />
                </View>
                <View style={barStyles.barTrack}>
                  <View
                    style={[barStyles.barFill, {
                      height: `${(tVal / (isReg ? maxV : 1)) * 100}%`,
                      backgroundColor: color,
                      opacity: 0.4,
                    }]}
                  />
                </View>
              </View>
              <Text style={barStyles.barVal}>{isReg ? vVal.toFixed(3) : (vVal * 100).toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { color: Colors.textMuted, fontSize: FontSize.xs },
  barsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  barGroup: { alignItems: 'center', gap: 4 },
  barLabel: { color: Colors.textMuted, fontSize: 9 },
  barPair: { flexDirection: 'row', gap: 3, height: 60, alignItems: 'flex-end' },
  barTrack: { width: 14, height: 60, backgroundColor: Colors.surfaceLight, borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 3 },
  barVal: { color: Colors.textSecondary, fontSize: 8 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  bestCard: {
    borderColor: Colors.warning + '60',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  bestBadge: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '800',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quickMetric: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  compareGrid: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  cmSection: {
    marginTop: Spacing.sm,
  },
  cmRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cmItem: {
    alignItems: 'center',
  },
  cmLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  featSection: {
    marginTop: Spacing.sm,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  featLabel: {
    width: 90,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  featBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
  },
  featBarFill: {
    height: 10,
    borderRadius: 3,
  },
  featValue: {
    width: 50,
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'right',
  },
  ensembleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
  },
  ensembleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },
});
