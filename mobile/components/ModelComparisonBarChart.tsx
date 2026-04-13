import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  models: Record<string, any>;
  type: 'regression' | 'classification';
  metric: string;          // e.g. 'r2', 'accuracy', 'f1'
  metricLabel: string;     // display label
  formatValue?: (v: number) => string;
}

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316',
];

const screenWidth = Dimensions.get('window').width - 64;

export default function ModelComparisonBarChart({
  models, type, metric, metricLabel, formatValue,
}: Props) {
  const entries = Object.entries(models).map(([name, m]) => {
    const val = m.val?.[metric] ?? m.test?.[metric] ?? 0;
    return { name: name.replace(/_/g, ' '), value: val, isBest: m.best === true };
  });

  if (entries.length === 0) return null;

  const maxVal = Math.max(...entries.map((e) => Math.abs(e.value)), 0.01);
  const barHeight = 28;
  const labelWidth = 110;
  const valueWidth = 55;
  const chartW = screenWidth - labelWidth - valueWidth;
  const svgHeight = entries.length * (barHeight + 10) + 30;

  const fmt = formatValue || ((v: number) => v.toFixed(4));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{metricLabel} Comparison</Text>
      <Svg width={screenWidth} height={svgHeight}>
        {/* Axis line */}
        <Line
          x1={labelWidth}
          y1={0}
          x2={labelWidth}
          y2={svgHeight - 20}
          stroke={Colors.border}
          strokeWidth={1}
        />
        {entries.map((entry, i) => {
          const y = i * (barHeight + 10) + 5;
          const barW = Math.max((Math.abs(entry.value) / maxVal) * chartW, 2);
          const color = entry.isBest ? Colors.secondary : CHART_COLORS[i % CHART_COLORS.length];

          return (
            <React.Fragment key={entry.name}>
              {/* Model name */}
              <SvgText
                x={labelWidth - 6}
                y={y + barHeight / 2 + 4}
                fontSize={10}
                fill={entry.isBest ? Colors.warning : Colors.textSecondary}
                textAnchor="end"
                fontWeight={entry.isBest ? 'bold' : 'normal'}
              >
                {entry.isBest ? '★ ' : ''}{entry.name.length > 16 ? entry.name.slice(0, 15) + '…' : entry.name}
              </SvgText>
              {/* Bar */}
              <Rect
                x={labelWidth + 2}
                y={y}
                width={barW}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={0.85}
              />
              {/* Value */}
              <SvgText
                x={labelWidth + barW + 8}
                y={y + barHeight / 2 + 4}
                fontSize={10}
                fill={Colors.text}
                fontWeight="600"
              >
                {fmt(entry.value)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
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
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
});
