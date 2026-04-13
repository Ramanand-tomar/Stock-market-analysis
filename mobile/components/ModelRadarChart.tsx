import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  modelName: string;
  metrics: Record<string, number>;  // e.g. { accuracy: 0.85, f1: 0.82, precision: 0.80, recall: 0.84 }
  isBest?: boolean;
  color?: string;
}

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const LEVELS = 4;

export default function ModelRadarChart({ modelName, metrics, isBest, color = Colors.primaryLight }: Props) {
  const keys = Object.keys(metrics);
  const values = Object.values(metrics);
  const n = keys.length;

  if (n < 3) return null;

  const angleSlice = (Math.PI * 2) / n;

  // Grid levels
  const gridLevels = Array.from({ length: LEVELS }, (_, i) => ((i + 1) / LEVELS) * RADIUS);

  // Axis endpoints
  const axes = keys.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

  // Data polygon points
  const dataPoints = values.map((v, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = Math.min(v, 1) * RADIUS;
    return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
  }).join(' ');

  // Label positions (slightly outside the chart)
  const labels = keys.map((key, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelR = RADIUS + 22;
    return {
      x: CENTER + labelR * Math.cos(angle),
      y: CENTER + labelR * Math.sin(angle),
      text: key.charAt(0).toUpperCase() + key.slice(1),
      value: values[i],
    };
  });

  const displayName = modelName.replace(/_/g, ' ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isBest && <Text style={styles.bestBadge}>★ Best</Text>}
        <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
      </View>
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Grid circles */}
          {gridLevels.map((r, i) => (
            <Circle
              key={`grid-${i}`}
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke={Colors.border}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
          ))}

          {/* Axes */}
          {axes.map((a, i) => (
            <Line
              key={`axis-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={a.x}
              y2={a.y}
              stroke={Colors.border}
              strokeWidth={0.5}
            />
          ))}

          {/* Data area */}
          <Polygon
            points={dataPoints}
            fill={color}
            fillOpacity={0.2}
            stroke={color}
            strokeWidth={2}
          />

          {/* Data points */}
          {values.map((v, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const r = Math.min(v, 1) * RADIUS;
            return (
              <Circle
                key={`dot-${i}`}
                cx={CENTER + r * Math.cos(angle)}
                cy={CENTER + r * Math.sin(angle)}
                r={3.5}
                fill={color}
              />
            );
          })}

          {/* Labels */}
          {labels.map((l, i) => (
            <SvgText
              key={`label-${i}`}
              x={l.x}
              y={l.y}
              fontSize={9}
              fill={Colors.textSecondary}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {l.text}
            </SvgText>
          ))}
        </Svg>
      </View>
      {/* Metric values below chart */}
      <View style={styles.valuesRow}>
        {labels.map((l, i) => (
          <View key={i} style={styles.valueItem}>
            <Text style={styles.valueLabel}>{l.text}</Text>
            <Text style={styles.valueNum}>{(l.value * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
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
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  valueItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  valueLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  valueNum: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
