import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
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

const INITIAL_CANVAS_SIZE = 800;
const PADDING = 60;
const VIEWPORT_SIZE = Dimensions.get('window').width - 48;

export default function PCAScatterPlot({ points }: Props) {
  const [zoom, setZoom] = React.useState(1);
  
  if (points.length === 0) {
    return <Text style={styles.empty}>No PCA data available</Text>;
  }

  const canvasSize = INITIAL_CANVAS_SIZE * zoom;
  const plotAreaSize = canvasSize - PADDING * 2;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const scaleX = (v: number) => PADDING + ((v - xMin) / xRange) * plotAreaSize;
  const scaleY = (v: number) => PADDING + ((yMax - v) / yRange) * plotAreaSize; // flip Y

  // Unique sectors for legend
  const sectors = [...new Set(points.map((p) => p.sector))].sort();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>PCA Projection (2D Map)</Text>
          <Text style={styles.hint}>← Pan & Zoom to explore →</Text>
        </View>
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn} onPress={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <Text style={styles.zoomText}>−</Text>
          </Pressable>
          <Pressable style={styles.zoomBtn} onPress={() => setZoom(z => Math.min(2, z + 0.25))}>
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
        </View>
      </View>
      
      <View style={styles.chartWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
        >
          <ScrollView 
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            nestedScrollEnabled={true}
          >
            <Svg width={canvasSize} height={canvasSize}>
              {points.map((p) => {
                const cx = scaleX(p.x);
                const cy = scaleY(p.y);
                const color = SECTOR_COLORS[p.sector] || Colors.textMuted;
                return (
                  <React.Fragment key={p.ticker}>
                    <Circle 
                      cx={cx} 
                      cy={cy} 
                      r={8 * zoom + 2} 
                      fill={color} 
                      opacity={0.9} 
                      stroke={Colors.background} 
                      strokeWidth={1} 
                    />
                    <SvgText
                      x={cx}
                      y={cy - (10 * zoom + 4)}
                      fontSize={Math.max(8, 11 * zoom)}
                      fontWeight="700"
                      fill={Colors.text}
                      textAnchor="middle"
                    >
                      {p.ticker.replace('.NS', '')}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </ScrollView>
        </ScrollView>
      </View>

      <View style={styles.insightsBox}>
        <Text style={styles.insightsTitle}>Quick Insights</Text>
        <Text style={styles.insightsText}>
          • Proximate stocks (like {points[0]?.ticker.replace('.NS', '')} and {points[1]?.ticker.replace('.NS', '')}) share similar price momentum and volatility patterns according to the PCA model.{"\n"}
          • Distant clusters indicate stocks with inversely correlated or independent movements.{"\n"}
          • {points.length > 0 ? "The distribution shows distinct sector-based grouping, suggesting sector trends are a primary driver of stock variance." : ""}
        </Text>
      </View>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  zoomControls: { flexDirection: 'row', gap: Spacing.sm },
  zoomBtn: { 
    backgroundColor: Colors.surfaceLight, 
    width: 32, 
    height: 32, 
    borderRadius: BorderRadius.sm, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoomText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs },
  chartWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    overflow: 'hidden',
    height: 420,
    marginTop: Spacing.sm,
  },
  insightsBox: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLight,
  },
  insightsTitle: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '700', marginBottom: 4 },
  insightsText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  empty: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xxl },
  legendTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
