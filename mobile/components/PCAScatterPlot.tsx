import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { PCAPoint } from '../api/insights';

interface Props {
  points: PCAPoint[];
}

const SECTOR_COLORS: Record<string, string> = {
  Financials: '#3B82F6',
  IT: '#10B981',
  Energy: '#F59E0B',
  Pharma: '#EF4444',
  Healthcare: '#EC4899',
  Automobile: '#8B5CF6',
  FMCG: '#06B6D4',
  Metals: '#F97316',
  Telecom: '#14B8A6',
  Infrastructure: '#6366F1',
  Power: '#A855F7',
  Cement: '#78716C',
  'Consumer Durables': '#D946EF',
};

const CHART_SIZE = Dimensions.get('window').width - 48;
const PADDING = 40;
const PLOT_SIZE = CHART_SIZE - PADDING * 2;

export default function PCAScatterPlot({ points }: Props) {
  if (points.length === 0) {
    return <Text style={styles.empty}>No PCA data available</Text>;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const scaleX = (v: number) => PADDING + ((v - xMin) / xRange) * PLOT_SIZE;
  const scaleY = (v: number) => PADDING + ((yMax - v) / yRange) * PLOT_SIZE; // flip Y

  // Unique sectors for legend
  const sectors = [...new Set(points.map((p) => p.sector))].sort();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PCA Projection (2D)</Text>
      <View style={styles.chartWrapper}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {points.map((p) => {
            const cx = scaleX(p.x);
            const cy = scaleY(p.y);
            const color = SECTOR_COLORS[p.sector] || Colors.textMuted;
            return (
              <React.Fragment key={p.ticker}>
                <Circle cx={cx} cy={cy} r={6} fill={color} opacity={0.85} />
                <SvgText
                  x={cx}
                  y={cy - 9}
                  fontSize={7}
                  fill={Colors.textSecondary}
                  textAnchor="middle"
                >
                  {p.ticker.replace('.NS', '')}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <Text style={styles.legendTitle}>Sectors</Text>
      <View style={styles.legend}>
        {sectors.map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SECTOR_COLORS[s] || Colors.textMuted }]} />
            <Text style={styles.legendText}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  chartWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    alignItems: 'center',
  },
  empty: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xxl },
  legendTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
